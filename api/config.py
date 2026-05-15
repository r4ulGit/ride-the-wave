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

# Trigger reload
