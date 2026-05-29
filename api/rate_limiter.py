import time
from collections import defaultdict
import config

# In-memory storage for request timestamps per client IP: { ip: [timestamp1, timestamp2, ...] }
_request_history = defaultdict(list)

def check_rate_limit(ip):
    """
    Checks if the given IP address is within the rate limits.
    Returns (True, None) if allowed, or (False, error_message) if rate limited.
    """
    # If auth or rate limiting is disabled/zeroed in config, pass through
    if config.RATE_LIMIT_MAX <= 0:
        return True, None

    now = time.time()
    cutoff = now - config.RATE_LIMIT_WINDOW

    # Get historical timestamps for this IP
    timestamps = _request_history[ip]

    # Prune timestamps older than the sliding window cutoff
    pruned_timestamps = [t for t in timestamps if t >= cutoff]
    
    # Check if number of requests exceeds maximum allowed
    if len(pruned_timestamps) >= config.RATE_LIMIT_MAX:
        # Update the list with only the pruned timestamps
        _request_history[ip] = pruned_timestamps
        return False, f"Too many requests. Limit is {config.RATE_LIMIT_MAX} requests per {config.RATE_LIMIT_WINDOW}s."

    # Record current request timestamp
    pruned_timestamps.append(now)
    _request_history[ip] = pruned_timestamps

    return True, None
