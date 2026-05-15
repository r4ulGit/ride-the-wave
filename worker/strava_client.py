import requests
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
    Fetches the most recent activities for the authenticated ATHLETE.
    Uses pagination to retrieve up to max_pages * per_page activities.
    
    Unlike the club endpoint, the athlete endpoint returns full activity
    details including real activity IDs, speeds, elevation, device info, etc.
    """
    headers = {'Authorization': f'Bearer {access_token}'}
    all_activities = []
    
    for page in range(1, max_pages + 1):
        params = {
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
