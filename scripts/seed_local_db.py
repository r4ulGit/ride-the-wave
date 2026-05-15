import boto3
import requests
import json
from decimal import Decimal

def seed_db():
    print("🌍 Fetching data from Production API...")
    try:
        response = requests.get("https://4gep4vk4j4tdbl2uhx2pdu5gt40hkcvy.lambda-url.eu-west-1.on.aws/")
        data = response.json()
        activities = data.get("last_10_activities", [])
    except Exception as e:
        print(f"❌ Failed to fetch from production API: {e}")
        return

    print(f"📦 Found {len(activities)} activities. Connecting to local DynamoDB...")
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url='http://localhost:8000',
        region_name='localhost',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
    
    table = dynamodb.Table('Ride-The-Wave-Activities')
    
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
