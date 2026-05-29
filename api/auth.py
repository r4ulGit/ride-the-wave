import time
import hmac
import secrets
import config

# In-memory token storage: { token: expires_at_epoch }
_active_tokens = {}

def is_auth_enabled():
    """
    Checks if API authentication is enabled in configuration.
    If either API_KEY or API_SIGNING_SECRET are missing, it defaults to False
    allowing easy development testing without credentials.
    """
    return bool(config.API_KEY) and bool(config.API_SIGNING_SECRET)

def verify_signed_request(headers):
    """
    Verifies the HMAC-SHA256 signature in the request headers.
    Used for authorizing token generation (/auth/token).
    """
    if not is_auth_enabled():
        return True, None

    # Case-insensitive headers lookup
    headers_lower = {k.lower(): v for k, v in headers.items()}
    api_key = headers_lower.get('x-api-key')
    timestamp_str = headers_lower.get('x-timestamp')
    nonce = headers_lower.get('x-nonce')
    signature = headers_lower.get('x-signature')

    if not all([api_key, timestamp_str, nonce, signature]):
        return False, "Missing required headers (X-Api-Key, X-Timestamp, X-Nonce, X-Signature)"

    # 1. Verify API Key
    if not hmac.compare_digest(api_key, config.API_KEY):
        return False, "Invalid API Key"

    # 2. Verify Timestamp (Replay Attack Prevention)
    try:
        req_time = int(timestamp_str)
    except ValueError:
        return False, "Invalid timestamp format"

    now = int(time.time())
    if abs(now - req_time) > config.AUTH_TOLERANCE_SECONDS:
        return False, f"Timestamp out of tolerance window (diff: {abs(now - req_time)}s)"

    # 3. Verify Signature
    message = f"{timestamp_str}.{nonce}"
    secret_bytes = config.API_SIGNING_SECRET.encode('utf-8')
    message_bytes = message.encode('utf-8')

    expected_sig = hmac.new(secret_bytes, message_bytes, digestmod='sha256').hexdigest()

    if not hmac.compare_digest(signature, expected_sig):
        return False, "Invalid Signature"

    return True, None

def generate_token():
    """
    Generates a cryptographically random short-lived token and records its expiration.
    Returns (token, expires_at)
    """
    token = secrets.token_hex(32)
    expires_at = int(time.time()) + config.TOKEN_TTL_SECONDS
    _active_tokens[token] = expires_at
    return token, expires_at

def verify_bearer_token(headers):
    """
    Verifies that the request has a valid, non-expired Bearer token.
    Used for authorizing data queries (/).
    """
    if not is_auth_enabled():
        return True, None

    headers_lower = {k.lower(): v for k, v in headers.items()}
    auth_header = headers_lower.get('authorization', '')

    if not auth_header.startswith('Bearer '):
        return False, "Missing or invalid Authorization header format. Expected 'Bearer <token>'"

    token = auth_header[7:].strip()
    now = int(time.time())

    # Lazily clean up expired tokens to prevent memory leaks
    expired_tokens = [t for t, exp in _active_tokens.items() if now > exp]
    for t in expired_tokens:
        _active_tokens.pop(t, None)

    # Check if token exists and is still valid
    expires_at = _active_tokens.get(token)
    if not expires_at:
        return False, "Invalid, expired, or non-existent token"

    if now > expires_at:
        _active_tokens.pop(token, None)
        return False, "Token has expired"

    return True, None
