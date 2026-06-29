import boto3
import requests
import json
import os
from decimal import Decimal
from pathlib import Path

try:
    from dotenv import load_dotenv
    # Load from api/.env or worker/.env
    for path in [Path(__file__).resolve().parent.parent / 'api' / '.env', Path(__file__).resolve().parent.parent / 'worker' / '.env']:
        if path.exists():
            load_dotenv(dotenv_path=path)
            break
except ImportError:
    pass

def seed_db():
    seed_url = os.getenv('SEED_API_URL')
    if not seed_url:
        print("⚠️ SEED_API_URL env var is not set. Cannot fetch production data to seed. Please set it or run with SEED_API_URL=<url>.")
        return

    print(f"🌍 Fetching data from Production API at {seed_url}...")
    try:
        response = requests.get(seed_url)
        data = response.json()
        # Support both 'last_activities' and 'last_10_activities' keys for compatibility
        activities = data.get("last_activities", data.get("last_10_activities", []))
    except Exception as e:
        print(f"❌ Failed to fetch from production API: {e}")
        return

    table_name = os.getenv('DYNAMODB_TABLE_NAME')
    if not table_name:
        print("❌ Error: DYNAMODB_TABLE_NAME env var is not set.")
        return

    print(f"📦 Found {len(activities)} activities. Connecting to local DynamoDB...")
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url='http://localhost:8000',
        region_name='localhost',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
    
    table = dynamodb.Table(table_name)
    
    for act in activities:
        item = {
            'activity_id': str(act.get('id', 'unknown')),
            'title': act.get('title', 'Unknown'),
            'sport_type': act.get('sport_type', 'Unknown'),
            'type': act.get('sport_type', 'Unknown'),
            'distance_km': Decimal(str(act.get('distance_km', 0))),
            'moving_time_seconds': act.get('moving_time_seconds', 0),
            'total_elevation_gain': Decimal(str(act.get('total_elevation_gain', 0))),
            'start_date': act.get('date', ''),
            'start_date_local': act.get('date_local', ''),
            'average_speed': Decimal(str(act.get('average_speed', 0))),
            'max_speed': Decimal(str(act.get('max_speed', 0))),
            'kudos_count': act.get('kudos_count', 0),
            'device_name': act.get('device_name', 'Unknown'),
            'summary_polyline': act.get('summary_polyline', '')
        }
        try:
            table.put_item(Item=item)
            print(f"✅ Inserted: {item['title']}")
        except Exception as e:
            print(f"❌ Failed to insert {item['title']}: {e}")

    print("🎉 Seeding complete!")

if __name__ == '__main__':
    seed_db()
