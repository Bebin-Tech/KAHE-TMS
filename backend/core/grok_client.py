from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


def get_grok_api_key():
    api_key = getattr(settings, 'GROK_API_KEY', '')
    if not api_key:
        raise ImproperlyConfigured('GROK_API_KEY is not configured in the environment.')
    return api_key


def grok_auth_headers():
    return {
        'Authorization': f'Bearer {get_grok_api_key()}',
        'Content-Type': 'application/json',
    }
