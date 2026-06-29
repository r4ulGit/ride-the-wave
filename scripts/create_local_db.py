import boto3
import os
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

def create_table():
    print("🔌 Connecting to local DynamoDB...")
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url='http://localhost:8000',
        region_name='localhost',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
    
    table_name = os.getenv('DYNAMODB_TABLE_NAME')
    if not table_name:
        print("❌ Error: DYNAMODB_TABLE_NAME env var is not set in api/.env or worker/.env")
        return

    
    try:
        print(f"🛠️ Creating table '{table_name}'...")
        table = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {
                    'AttributeName': 'activity_id',
                    'KeyType': 'HASH'
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'activity_id',
                    'AttributeType': 'S'
                }
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            }
        )
        
        # Wait until the table exists.
        table.meta.client.get_waiter('table_exists').wait(TableName=table_name)
        print("✅ Table created successfully!")
        
    except Exception as e:
        if "Table already exists" in str(e):
            print("⚠️ Table already exists.")
        else:
            print(f"❌ Error creating table: {e}")

if __name__ == '__main__':
    create_table()
