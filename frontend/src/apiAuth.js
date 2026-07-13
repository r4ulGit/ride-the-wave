const TOKEN_CACHE_KEY = 'rtw_auth_token';
const TOKEN_EXPIRY_KEY = 'rtw_auth_expires';

// In-flight token request deduplication — prevents parallel iframes from
// each requesting their own token (which causes 401s due to Lambda's
// in-memory token store across concurrent instances).
let _pendingTokenRequest = null;

// Helper to check if cached token is still valid (with 30s safety buffer)
function getCachedToken() {
  const token = sessionStorage.getItem(TOKEN_CACHE_KEY);
  const expiresAtStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!token || !expiresAtStr) return null;

  const expiresAt = parseInt(expiresAtStr, 10);
  const now = Math.floor(Date.now() / 1000);

  // If token has at least 30s of lifetime left, use it
  if (now < (expiresAt - 30)) {
    return token;
  }
  
  return null;
}

// Request a new short-lived token from backend via HMAC-signed POST request
async function requestNewToken() {
  const apiKey = import.meta.env.VITE_API_KEY;
  const signingSecret = import.meta.env.VITE_API_SIGNING_SECRET;

  if (!apiKey || !signingSecret) {
    console.warn("⚠️ API auth keys missing in environment configuration. Passthrough mode enabled.");
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID();
  const message = `${timestamp}.${nonce}`;

  try {
    // 1. Encode keys and payload to Uint8Array
    const encoder = new TextEncoder();
    const secretData = encoder.encode(signingSecret);
    const messageData = encoder.encode(message);

    // 2. Import secret key for Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      secretData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // 3. Compute HMAC-SHA256 signature
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );

    // 4. Convert signature buffer to hex string
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signature = signatureArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // 5. Send signed request to obtain a short-lived token
    const baseUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    const tokenUrl = `${baseUrl}/auth/token`;

    console.log("🔑 Requesting fresh API token from backend...");
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'X-Timestamp': timestamp,
        'X-Nonce': nonce,
        'X-Signature': signature,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP ${response.status}`);
    }

    const { token, expires_at } = await response.json();
    
    // Save to cache
    sessionStorage.setItem(TOKEN_CACHE_KEY, token);
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, expires_at.toString());
    
    console.log("✅ Successfully cached fresh API Bearer token.");
    return token;

  } catch (error) {
    console.error("🔥 Error acquiring API Bearer token:", error);
    throw error;
  }
}

/**
 * Returns authorization headers (Bearer token) for data fetches.
 * Resolves with cached token if valid, otherwise retrieves a new one.
 * 
 * Deduplicates concurrent calls: if a token request is already in-flight
 * (e.g. from a parallel iframe), subsequent callers share the same promise
 * instead of firing a second POST /auth/token.
 */
export async function getAuthHeaders() {
  const cachedToken = getCachedToken();
  if (cachedToken) {
    return { 'Authorization': `Bearer ${cachedToken}` };
  }

  // Deduplicate: if a request is already in-flight, wait for it
  if (_pendingTokenRequest) {
    try {
      const token = await _pendingTokenRequest;
      if (token) {
        return { 'Authorization': `Bearer ${token}` };
      }
    } catch {
      // If the pending request failed, fall through to try our own
    }
  }

  // No in-flight request — start one and share the promise
  _pendingTokenRequest = requestNewToken().finally(() => {
    _pendingTokenRequest = null;
  });

  const freshToken = await _pendingTokenRequest;
  if (freshToken) {
    return { 'Authorization': `Bearer ${freshToken}` };
  }

  return {}; // Returns empty if no auth is configured
}
