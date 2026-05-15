import boto3
from decimal import Decimal
from datetime import datetime
from botocore.exceptions import ClientError
import config

# Initialize DynamoDB resource
if config.USE_LOCAL_DB:
    print(f"🔌 Using LOCAL DynamoDB at {config.LOCAL_DB_ENDPOINT}")
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url=config.LOCAL_DB_ENDPOINT,
        region_name='localhost',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
else:
    dynamodb = boto3.resource('dynamodb', region_name=config.AWS_REGION)

table = dynamodb.Table(config.DYNAMODB_TABLE_NAME)

def save_activity(activity):
    """
    Parses and saves a single athlete activity into DynamoDB.
    The athlete endpoint provides real activity IDs, so no synthetic ID needed.
    Returns True if saved, False if skipped or error.
    """
    try:
        # 1. Use real Strava activity ID (always available from athlete endpoint)
        activity_id = str(activity['id'])

        # 2. Handle Date
        start_date = activity.get('start_date')
        if not start_date:
            start_date = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
        
        start_date_local = activity.get('start_date_local', start_date)

        # 3. Create Item with enriched athlete data
        item = {
            'activity_id': activity_id,
            'title': activity.get('name', 'Unknown'),
            'sport_type': activity.get('sport_type', 'Unknown'),
            'type': activity.get('type', 'Unknown'),
            'distance_km': Decimal(str(round(activity.get('distance', 0) / 1000, 2))),
            'moving_time_seconds': int(activity.get('moving_time', 0)),
            'elapsed_time_seconds': int(activity.get('elapsed_time', 0)),
            'total_elevation_gain': Decimal(str(round(activity.get('total_elevation_gain', 0), 1))),
            'start_date': start_date,
            'start_date_local': start_date_local,
            'average_speed': Decimal(str(round(activity.get('average_speed', 0), 3))),
            'max_speed': Decimal(str(round(activity.get('max_speed', 0), 1))),
            'kudos_count': int(activity.get('kudos_count', 0)),
            'achievement_count': int(activity.get('achievement_count', 0)),
            'device_name': activity.get('device_name', 'Unknown'),
        }

        # 3b. Extract summary_polyline from the map object (if present)
        map_data = activity.get('map', {})
        summary_polyline = map_data.get('summary_polyline', '')
        if summary_polyline:
            item['summary_polyline'] = summary_polyline
        
        # 4. Insert with Condition (Fail if exists to preserve original date)
        table.put_item(
            Item=item,
            ConditionExpression='attribute_not_exists(activity_id)'
        )
        
        print(f"💾 Saved NEW: {item['title']} ({item['sport_type']}, {item['distance_km']} km)")
        return True

    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            print(f"⏭️ Skipped (Already exists): {activity.get('name')}")
            # Item exists, silently skip
            return False
        else:
            print(f"⚠️ DynamoDB Error: {e}")
            return False
            
    except Exception as e:
        print(f"⚠️ General Error saving activity: {e}")
        return False
