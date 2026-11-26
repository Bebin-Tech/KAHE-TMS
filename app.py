import os
import sys
from pathlib import Path

# The backend's Django apps are imported relative to the backend directory.
sys.path.insert(0, str(Path(__file__).resolve().parent / 'backend'))
os.environ['DJANGO_SETTINGS_MODULE'] = 'tms_project.settings'

from tms_project.fastapi_app import app
