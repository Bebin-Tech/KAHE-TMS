from django.db import migrations, models


def count_imported_activities(apps, schema_editor):
    imports = apps.get_model('core', 'AcademicCalendarImport').objects.using(schema_editor.connection.alias)
    for item in imports.only('id', 'layout').iterator(chunk_size=1):
        item.activity_count = sum(
            bool(row.get('date_key') and row.get('particulars'))
            for row in (item.layout or {}).get('rows', [])
        )
        item.save(update_fields=['activity_count'])


class Migration(migrations.Migration):
    dependencies = [('core', '0019_academiccalendarimport')]

    operations = [
        migrations.AddField(
            model_name='academiccalendarimport',
            name='activity_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.RunPython(count_imported_activities, migrations.RunPython.noop),
        migrations.AddIndex(
            model_name='academiccalendarevent',
            index=models.Index(fields=['created_by', 'start_date', 'title', 'id'],
                               condition=models.Q(is_active=True), name='cal_active_owner_start_idx'),
        ),
        migrations.AddIndex(
            model_name='academiccalendarevent',
            index=models.Index(fields=['start_date'], condition=models.Q(
                is_active=True, task_released_at__isnull=True,
                generated_task__isnull=False, assigned_to__isnull=False,
            ), name='cal_unreleased_start_idx'),
        ),
    ]
