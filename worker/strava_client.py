import requests
import time
import config

def refresh_access_token():
    """
    Exchanges the refresh token for a new valid access token.
    """
    print("🔄 Requesting new access token from Strava...")
    payload = {
        'client_id': config.STRAVA_CLIENT_ID,
        'client_secret': config.STRAVA_CLIENT_SECRET,
        'refresh_token': config.STRAVA_REFRESH_TOKEN,
        'grant_type': "refresh_token"
    }
    
    try:
        response = requests.post(config.AUTH_URL, data=payload, timeout=10)
        response.raise_for_status()
        return response.json()['access_token']
    except Exception as e:
        print(f"❌ Authentication Error: {e}")
        if 'response' in locals():
            print(f"   Auth Response: {response.text}")
        return None

def get_athlete_activities(access_token, per_page=200, max_pages=5):
    """
    Fetches activities from the last 7 days for the authenticated ATHLETE.
    Uses before/after epoch timestamps (same logic as the Bruno pre-request script)
    and paginates through results until there are no more activities.
    Duplicate prevention is handled at the DB layer (condition on activity_id).
    """
    headers = {'Authorization': f'Bearer {access_token}'}
    all_activities = []

    # Calculate time window: now and starting date (in Unix epoch seconds)
    now = int(time.time())
    
    # Default is 7 days ago
    start_epoch = now - (7 * 24 * 60 * 60)
    
    if config.START_DATE:
        try:
            from datetime import datetime
            # Parse 'DD/MM/YYYY' and convert to Unix Epoch timestamp
            dt = datetime.strptime(config.START_DATE.strip(), '%d/%m/%Y')
            start_epoch = int(dt.timestamp())
            print(f"📅 Fetching activities from custom START_DATE env: {config.START_DATE} -> Epoch: {start_epoch} to Now: {now}")
        except Exception as e:
            print(f"⚠️ Error parsing START_DATE env '{config.START_DATE}' (Expected DD/MM/YYYY): {e}")
            print(f"📅 Falling back to default (last 7 days): {start_epoch}")
    else:
        print(f"📅 Fetching activities from default range: last 7 days (Epoch: {start_epoch} to Now: {now})")
    
    for page in range(1, max_pages + 1):
        params = {
            'before': now,
            'after': start_epoch,
            'per_page': per_page,
            'page': page
        }
        
        print(f"📡 Fetching page {page} from: {config.ACTIVITIES_URL}")
        
        try:
            response = requests.get(
                config.ACTIVITIES_URL,
                headers=headers,
                params=params,
                timeout=15
            )
            response.raise_for_status()
            activities = response.json()
            
            if not activities:
                print(f"📭 No more activities on page {page}. Done.")
                break
                
            all_activities.extend(activities)
            print(f"   ✅ Got {len(activities)} activities from page {page}")
            
            # If we got fewer than requested, we've reached the end
            if len(activities) < per_page:
                break
                
        except Exception as e:
            print(f"❌ API Error on page {page}: {e}")
            if 'response' in locals():
                print(f"   API Response Body: {response.text}")
            break
    
    return all_activities
