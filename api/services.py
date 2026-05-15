from collections import defaultdict
from datetime import datetime
import config
from database import get_all_activities
from utils import format_pace, format_duration

def process_activities_logic():
    # 1. Fetch all data from DynamoDB
    items = get_all_activities()
    
    # 2. Process all activities — build comprehensive stats
    total_km = 0
    total_elevation = 0
    total_time_seconds = 0
    total_kudos = 0
    match_count = 0
    filter_lower = config.TITLE_FILTER.lower()
    
    # Per-sport breakdown
    sport_stats = defaultdict(lambda: {
        'count': 0,
        'distance_km': 0,
        'time_seconds': 0,
        'elevation': 0
    })
    
    # Weekly aggregation (last 8 weeks)
    weekly_data = defaultdict(lambda: {'distance_km': 0, 'count': 0})
    
    matched_activities = []
    all_activities_list = []
    
    for item in items:
        sport = item.get('sport_type', item.get('type', 'Unknown'))
        distance = float(item.get('distance_km', 0))
        moving_time = int(item.get('moving_time_seconds', 0))
        elevation = float(item.get('total_elevation_gain', 0))
        kudos = int(item.get('kudos_count', 0))
        
        # Global totals
        total_km += distance
        total_elevation += elevation
        total_time_seconds += moving_time
        total_kudos += kudos
        
        # Per-sport aggregation
        sport_stats[sport]['count'] += 1
        sport_stats[sport]['distance_km'] += distance
        sport_stats[sport]['time_seconds'] += moving_time
        sport_stats[sport]['elevation'] += elevation
        
        # Weekly aggregation
        start_date_str = item.get('start_date', '')
        if start_date_str:
            try:
                dt = datetime.strptime(start_date_str, '%Y-%m-%dT%H:%M:%SZ')
                # ISO week key: "2026-W20"
                week_key = f"{dt.isocalendar()[0]}-W{dt.isocalendar()[1]:02d}"
                weekly_data[week_key]['distance_km'] += distance
                weekly_data[week_key]['count'] += 1
            except ValueError:
                pass
        
        # Build activity detail
        activity_detail = {
            "id": item.get('activity_id'),
            "title": item.get('title'),
            "sport_type": sport,
            "distance_km": distance,
            "moving_time_seconds": moving_time,
            "moving_time_display": format_duration(moving_time),
            "total_elevation_gain": elevation,
            "average_speed": float(item.get('average_speed', 0)),
            "max_speed": float(item.get('max_speed', 0)),
            "kudos_count": kudos,
            "device_name": item.get('device_name', 'Unknown'),
            "date": item.get('start_date'),
            "date_local": item.get('start_date_local', item.get('start_date')),
            "summary_polyline": item.get('summary_polyline', ''),
        }
        
        # Add pace for running activities
        avg_speed = float(item.get('average_speed', 0))
        if 'run' in sport.lower() and avg_speed > 0:
            activity_detail['pace'] = format_pace(avg_speed)
        
        all_activities_list.append(activity_detail)
        
        # Filter matching
        item_type = item.get('type', '').lower()
        if filter_lower in item_type:
            match_count += 1
            matched_activities.append(activity_detail)
    
    print(f"📊 Result: {len(items)} total activities, {match_count} '{config.TITLE_FILTER}' matches. Total: {total_km:.2f} km.")

    # Sort activities by date (newest first)
    all_activities_list.sort(key=lambda x: x.get('date', ''), reverse=True)
    matched_activities.sort(key=lambda x: x.get('date', ''), reverse=True)
    last_10_activities = all_activities_list[:10]
    
    # Sort weekly data and get last 8 weeks
    sorted_weeks = sorted(weekly_data.keys(), reverse=True)[:8]
    sorted_weeks.reverse()  # Chronological order for charts
    weekly_chart = [
        {
            'week': w,
            'distance_km': round(weekly_data[w]['distance_km'], 2),
            'count': weekly_data[w]['count']
        }
        for w in sorted_weeks
    ]
    
    # Convert sport_stats to list
    sport_breakdown = [
        {
            'sport': sport,
            'count': stats['count'],
            'distance_km': round(stats['distance_km'], 2),
            'time_seconds': stats['time_seconds'],
            'time_display': format_duration(stats['time_seconds']),
            'elevation': round(stats['elevation'], 1)
        }
        for sport, stats in sorted(sport_stats.items(), key=lambda x: x[1]['distance_km'], reverse=True)
    ]

    # 3. Create comprehensive response
    response_data = {
        "total_km": round(total_km, 2),
        "total_activities": len(items),
        "total_elevation": round(total_elevation, 1),
        "total_time_seconds": total_time_seconds,
        "total_time_display": format_duration(total_time_seconds),
        "total_kudos": total_kudos,
        "filtered_km": round(sum(a['distance_km'] for a in matched_activities), 2),
        "matches_found": match_count,
        "last_10_activities": last_10_activities,
        "sport_breakdown": sport_breakdown,
        "weekly_chart": weekly_chart,
        "config": {
            "goal_km": config.GOAL_KM,
            "filter_word": config.TITLE_FILTER
        }
    }

    return response_data
