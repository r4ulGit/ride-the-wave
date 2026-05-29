import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    current_dir = Path(__file__).resolve().parent
    env_path = current_dir / '.env'
    load_dotenv(dotenv_path=env_path, override=True)
except ImportError:
    pass

DYNAMODB_TABLE_NAME = os.getenv('DYNAMODB_TABLE_NAME', 'Ride-The-Wave-Activities')
AWS_REGION = os.getenv('AWS_REGION', 'eu-west-1')

# Local DB Configuration
USE_LOCAL_DB = os.getenv('USE_LOCAL_DB', 'false').lower() == 'true'
LOCAL_DB_ENDPOINT = os.getenv('LOCAL_DB_ENDPOINT', 'http://localhost:8000')

AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

TITLE_FILTER = os.getenv('TITLE_FILTER', 'Run')
try:
    GOAL_KM = float(os.getenv('GOAL_KM', 500))
except (ValueError, TypeError):
    GOAL_KM = 500.0

# API Auth configuration
API_KEY = os.getenv('API_KEY', '')
API_SIGNING_SECRET = os.getenv('API_SIGNING_SECRET', '')
try:
    AUTH_TOLERANCE_SECONDS = int(os.getenv('AUTH_TOLERANCE_SECONDS', 300))
except (ValueError, TypeError):
    AUTH_TOLERANCE_SECONDS = 300

try:
    TOKEN_TTL_SECONDS = int(os.getenv('TOKEN_TTL_SECONDS', 300))
except (ValueError, TypeError):
    TOKEN_TTL_SECONDS = 300

# Rate limiting
try:
    RATE_LIMIT_MAX = int(os.getenv('RATE_LIMIT_MAX', 30))
except (ValueError, TypeError):
    RATE_LIMIT_MAX = 30



try:
    RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', 60))
except (ValueError, TypeError):
    RATE_LIMIT_WINDOW = 60

# CORS Allowed Origins
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')

