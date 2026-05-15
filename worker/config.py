import os
from dotenv import load_dotenv

# Load environment variables (for local testing)
load_dotenv()

# --- ENVIRONMENT VARIABLES ---
STRAVA_CLIENT_ID = os.getenv('STRAVA_CLIENT_ID')
STRAVA_CLIENT_SECRET = os.getenv('STRAVA_CLIENT_SECRET')
STRAVA_REFRESH_TOKEN = os.getenv('STRAVA_REFRESH_TOKEN')
DYNAMODB_TABLE_NAME = os.getenv('DYNAMODB_TABLE_NAME', 'strava_athlete_activities')
AWS_REGION = os.getenv('AWS_REGION', 'eu-west-1')

# --- CONSTANTS & URLS ---
AUTH_URL = "https://www.strava.com/oauth/token"
ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities"
