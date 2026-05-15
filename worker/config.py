import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    current_dir = Path(__file__).resolve().parent
    env_path = current_dir / '.env'
    load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

# --- AWS CONFIG ---
DYNAMODB_TABLE_NAME = os.getenv('DYNAMODB_TABLE_NAME', 'Ride-The-Wave-Activities')
AWS_REGION = os.getenv('AWS_REGION', 'eu-west-1')

# Local DB Configuration
USE_LOCAL_DB = os.getenv('USE_LOCAL_DB', 'false').lower() == 'true'
LOCAL_DB_ENDPOINT = os.getenv('LOCAL_DB_ENDPOINT', 'http://localhost:8000')

AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

# --- STRAVA CONFIG ---
STRAVA_CLIENT_ID = os.getenv('STRAVA_CLIENT_ID')
STRAVA_CLIENT_SECRET = os.getenv('STRAVA_CLIENT_SECRET')
STRAVA_REFRESH_TOKEN = os.getenv('STRAVA_REFRESH_TOKEN')

# --- CONSTANTS & URLS ---
AUTH_URL = "https://www.strava.com/oauth/token"
ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities"
