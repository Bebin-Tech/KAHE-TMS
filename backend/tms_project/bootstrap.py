import os

from django.core.management import call_command


def deployment_bootstrap():
    should_bootstrap = os.environ.get('AUTO_CREATE_DB') == '1' or os.environ.get('AUTO_MIGRATE') == '1'
    if not should_bootstrap:
        return

    call_command('migrate', interactive=False, verbosity=0)
    if os.environ.get('AUTO_SEED_DATA') == '1':
        call_command('seed_initial_data', verbosity=0)
