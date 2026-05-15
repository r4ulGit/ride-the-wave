import json
import config
import strava_client
import database

# --- MAIN HANDLER ---
def retrieve_strava_data_lambda(event, context):
    print("🚀 Starting Strava Athlete Worker...")
    
    # Debug config
    print(f"🔍 CONFIG CHECK: Table='{config.DYNAMODB_TABLE_NAME}'")

    # Validation
    if not config.STRAVA_REFRESH_TOKEN:
        print("❌ Config Error: Missing STRAVA_REFRESH_TOKEN.")
        return {'statusCode': 500, 'body': 'Config Error'}

    # 1. Auth (using strava_client)
    token = strava_client.refresh_access_token()
    if not token:
        return {'statusCode': 401, 'body': 'Auth Failed'}

    # 2. Fetch athlete activities (using strava_client)
    activities = strava_client.get_athlete_activities(token)
    print(f"📡 Retrieved {len(activities)} activities from Athlete.")

    # 3. Save (using database)
    saved_count = 0
    for act in activities:
        if database.save_activity(act):
            saved_count += 1

    msg = f"Process completed. New activities saved: {saved_count}/{len(activities)}."
    print(msg)

    return {'statusCode': 200, 'body': json.dumps(msg)}

# Allow local execution
if __name__ == "__main__":
    retrieve_strava_data_lambda(None, None)
