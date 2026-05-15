import boto3
import config

# Initialize DynamoDB resource
try:
    dynamodb = boto3.resource('dynamodb', region_name=config.AWS_REGION)
    table = dynamodb.Table(config.DYNAMODB_TABLE_NAME)
except Exception as e:
    print(f"❌ Error initializing DynamoDB: {e}")

def get_all_activities():
    try:
        response = table.scan()
        data = response.get('Items', [])
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            data.extend(response.get('Items', []))
        return data
    except Exception as e:
        print(f"❌ Database Error: {str(e)}")
        raise e
