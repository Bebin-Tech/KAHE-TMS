import json
import os
from collections import defaultdict
from io import StringIO
from pathlib import Path
from urllib.parse import urlsplit

import dj_database_url
from django.apps import apps
from django.contrib.auth.hashers import check_password, make_password
from django.core import serializers
from django.core.management import BaseCommand, CommandError, call_command
from django.db import connections, transaction
from django.db.models import Q
from django.db.models.sql import InsertQuery
from django.core.management.color import no_style

from core.models import User


TARGET = 'kahe_import'
STARTER_PASSWORDS = ('admin@kahe', 'admin123')


class Command(BaseCommand):
    help = 'Import local KAHE records into an empty PostgreSQL database.'

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help='Commit the import.')

    def handle(self, *args, **options):
        source = connections['default']
        if source.vendor != 'sqlite':
            raise CommandError('The default database must be the source SQLite database.')
        if not Path(source.settings_dict['NAME']).is_file():
            raise CommandError('The source SQLite database file was not found.')
        if User.objects.filter(Q(groups__isnull=False) | Q(user_permissions__isnull=False)).exists():
            raise CommandError('User group or Django permission assignments need a separate migration.')

        url = os.environ.get('KAHE_DATABASE_URL_UNPOOLED', '').strip()
        if urlsplit(url).scheme not in {'postgresql', 'postgres'}:
            raise CommandError('Set KAHE_DATABASE_URL_UNPOOLED to the direct Neon PostgreSQL URL.')
        connections.databases[TARGET] = {
            **source.settings_dict,
            **dj_database_url.parse(url, conn_max_age=0, ssl_require=True),
        }

        models = list(apps.get_app_config('core').get_models())
        with transaction.atomic(using='default'):
            output = StringIO()
            call_command('dumpdata', 'core', database='default', use_base_manager=True, stdout=output)
        records = json.loads(output.getvalue())
        disabled = self.disable_starter_passwords(records)
        self.import_records(records, models, options['apply'])

        action = 'Committed' if options['apply'] else 'Validated and rolled back'
        self.stdout.write(f'{action}: {len(records)} records. Starter passwords disabled: {disabled}.')

    def disable_starter_passwords(self, records):
        disabled = 0
        for entry in records:
            if entry['model'] != 'core.user':
                continue
            fields = entry['fields']
            if any(check_password(password, fields['password']) for password in STARTER_PASSWORDS):
                fields['password'] = make_password(None)
                fields['must_change_password'] = True
                disabled += 1
        return disabled

    def import_records(self, records, models, apply):
        batches = defaultdict(list)
        for item in serializers.deserialize('python', records, using=TARGET):
            if any(item.m2m_data.values()):
                raise CommandError('The import cannot remap existing many-to-many references.')
            batches[type(item.object)].append(item.object)

        connection = connections[TARGET]
        with transaction.atomic(using=TARGET):
            with connection.cursor() as cursor:
                cursor.execute('SELECT pg_advisory_xact_lock(hashtext(%s))', ['kahe-core-data-import'])
            if any(model._base_manager.using(TARGET).exists() for model in models):
                raise CommandError('The destination already has KAHE records. Import stopped.')
            for model, objects in batches.items():
                # Raw inserts preserve existing timestamps and primary keys.
                fields = model._meta.local_concrete_fields
                for offset in range(0, len(objects), 100):
                    query = InsertQuery(model)
                    query.insert_values(fields, objects[offset:offset + 100], raw=True)
                    query.get_compiler(using=TARGET).execute_sql()
            connection.check_constraints()
            actual_count = sum(model._base_manager.using(TARGET).count() for model in models)
            if actual_count != len(records):
                raise CommandError('The imported record count did not match the source.')
            if apply:
                with connection.cursor() as cursor:
                    for sql in connection.ops.sequence_reset_sql(no_style(), models):
                        cursor.execute(sql)
            else:
                transaction.set_rollback(True, using=TARGET)
