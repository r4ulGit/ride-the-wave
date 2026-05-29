import json
import config
import auth
import rate_limiter
from utils import DecimalEncoder
from services import process_activities_logic

def add_cors_headers(response, origin='*'):
    """
    Utility function to append standard CORS headers to Lambda responses.
    """
    if 'headers' not in response:
        response['headers'] = {}
    
    response['headers']['Content-Type'] = 'application/json'
    response['headers']['Access-Control-Allow-Origin'] = origin
    response['headers']['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Api-Key,X-Timestamp,X-Nonce,X-Signature'
    response['headers']['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

def handle_auth_token(headers):
    """
    Validates HMAC signature and issues a short-lived Bearer token.
    """
    print("🔑 Token request received...")
    try:
        is_valid, error_msg = auth.verify_signed_request(headers)
        if not is_valid:
            print(f"❌ Signature verification failed: {error_msg}")
            return {
                'statusCode': 401,
                'body': json.dumps({'error': error_msg})
            }
        
        token, expires_at = auth.generate_token()
        print(f"✅ Token issued successfully! Expires in {config.TOKEN_TTL_SECONDS}s.")
        return {
            'statusCode': 200,
            'body': json.dumps({
                'token': token,
                'expires_at': expires_at
            })
        }
    except Exception as e:
        print(f"🔥 Token generation critical error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def handle_data_request(headers, client_ip):
    """
    Validates Bearer token and checks rate limiting before processing data stats.
    """
    print(f"🚀 Data request received from {client_ip}...")
    try:
        # 1. Rate Limiting Check
        is_allowed, limit_msg = rate_limiter.check_rate_limit(client_ip)
        if not is_allowed:
            print(f"⚠️ Rate limit exceeded for IP {client_ip}")
            return {
                'statusCode': 429,
                'body': json.dumps({'error': limit_msg})
            }

        # 2. Bearer Token Verification
        is_valid, auth_msg = auth.verify_bearer_token(headers)
        if not is_valid:
            print(f"❌ Bearer token verification failed: {auth_msg}")
            return {
                'statusCode': 401,
                'body': json.dumps({'error': auth_msg})
            }

        # 3. Process Activities Logic
        response_data = process_activities_logic()
        return {
            'statusCode': 200,
            'body': json.dumps(response_data, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"🔥 Critical Data Request Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def process_activities(event, context):
    """
    Main AWS Lambda function entry point.
    Handles path routing, preflight OPTIONS, and CORS.
    """
    if not event:
        event = {}
        
    path = event.get('rawPath', '/')
    # Handle direct requestContext path for format version 1.0 or local dev tests
    if path == '/' and event.get('path'):
        path = event.get('path')
        
    method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    headers = event.get('headers', {})
    
    # Resolve CORS origin from headers if present, default to *
    origin = headers.get('origin', '*')
    
    # Preflight preflight requests
    if method == 'OPTIONS':
        return add_cors_headers({'statusCode': 204, 'body': ''}, origin)
    
    # Resolve Client IP
    client_ip = event.get('requestContext', {}).get('http', {}).get('sourceIp')
    if not client_ip:
        headers_lower = {k.lower(): v for k, v in headers.items()}
        forwarded_for = headers_lower.get('x-forwarded-for', '')
        if forwarded_for:
            client_ip = forwarded_for.split(',')[0].strip()
        else:
            client_ip = '127.0.0.1'

    # Route request
    if path == '/auth/token' and method == 'POST':
        response = handle_auth_token(headers)
    elif path == '/' and method == 'GET':
        response = handle_data_request(headers, client_ip)
    else:
        response = {
            'statusCode': 404,
            'body': json.dumps({'error': f"Not Found: {method} {path}"})
        }
        
    return add_cors_headers(response, origin)

# --- LOCAL SERVER ---
if __name__ == "__main__":
    try:
        from flask import Flask, Response, request
        from flask_cors import CORS
    except ImportError:
        print("❌ Error: Install Flask with 'pip install flask flask-cors'")
        exit(1)

    app = Flask(__name__)
    
    # Parse allowed origins from CORS config
    origins_list = [o.strip() for o in config.CORS_ALLOWED_ORIGINS.split(',') if o.strip()]
    CORS(app, origins=origins_list, allow_headers=['Content-Type', 'Authorization', 'X-Api-Key', 'X-Timestamp', 'X-Nonce', 'X-Signature']) 

    print("\n🌍 STARTING LOCAL SERVER WITH AUTH & RATE LIMITER...")
    print(f"   👉 Allowed CORS Origins: {origins_list}")
    print(f"   👉 Auth Status: {'ENABLED' if auth.is_auth_enabled() else 'DISABLED (Passthrough mode)'}")
    print(f"   👉 Rate Limit: {config.RATE_LIMIT_MAX} requests per {config.RATE_LIMIT_WINDOW}s")
    print("   👉 Listening at: http://127.0.0.1:5000\n")

    @app.route("/auth/token", methods=['POST', 'OPTIONS'])
    def local_token_handler():
        if request.method == 'OPTIONS':
            return Response(status=204)
        headers = dict(request.headers)
        result = handle_auth_token(headers)
        return Response(
            response=result['body'], 
            status=result['statusCode'], 
            mimetype='application/json'
        )

    @app.route("/", methods=['GET'])
    def local_handler():
        headers = dict(request.headers)
        client_ip = request.remote_addr or '127.0.0.1'
        result = handle_data_request(headers, client_ip)
        return Response(
            response=result['body'], 
            status=result['statusCode'], 
            mimetype='application/json'
        )

    app.run(port=5000, debug=True)
