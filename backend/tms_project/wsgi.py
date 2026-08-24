import os
from django.core.wsgi import get_wsgi_application
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tms_project.settings')
application = get_wsgi_application()

try:
    from tms_project.bootstrap import deployment_bootstrap
    deployment_bootstrap()
except Exception as exc:
    if os.environ.get('DEBUG', 'False') == 'True':
        raise
    print(f'Deployment bootstrap skipped: {exc}')

app = application
