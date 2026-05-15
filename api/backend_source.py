import json
import config
from utils import DecimalEncoder
from services import process_activities_logic

def process_activities(event, context):
    print(f"🚀 API Request received. Filter: '{config.TITLE_FILTER}', Goal: {config.GOAL_KM}km")
    
    try:
        response_data = process_activities_logic()

        return {
            'statusCode': 200,
            'body': json.dumps(response_data, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"🔥 Critical Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

# --- LOCAL SERVER ---
if __name__ == "__main__":
    try:
        from flask import Flask, Response
        from flask_cors import CORS
    except ImportError:
        print("❌ Error: Install Flask with 'pip install flask flask-cors'")
        exit(1)

    app = Flask(__name__)
    CORS(app) 

    print("\n🌍 STARTING LOCAL SERVER...")
    print(f"   👉 Config: Filter='{config.TITLE_FILTER}', Goal={config.GOAL_KM}km")
    print("   👉 Listening at: http://127.0.0.1:5000\n")

    @app.route("/", methods=['GET'])
    def local_handler():
        result = process_activities(None, None)
        return Response(
            response=result['body'], 
            status=result['statusCode'], 
            mimetype='application/json'
        )

    app.run(port=5000, debug=True)
