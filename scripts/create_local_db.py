import boto3
import os

def create_table():
    print("🔌 Connecting to local DynamoDB...")
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url='http://localhost:8000',
        region_name='localhost',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
    
    table_name = 'Ride-The-Wave-Activities'
    
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
