# 🌊 Ride the Wave — AI Agent Context

> This file provides full project context for any AI coding agent working on this
> repository or on forks of it. Read this before making changes.

---

## 1. Project Overview

**Ride the Wave** is a personal athlete activity dashboard that:
1. Fetches activity data from the **Strava API** (runs, rides, hikes, etc.)
2. Stores it in **AWS DynamoDB**
3. Displays it on a **premium React dashboard** deployed to Vercel

**Production URL:** `https://ride-the-wave-nine.vercel.app/`

**GitHub Repo:** `https://github.com/r4ulGit/ride-the-wave`

---

## 2. Architecture

The project is a **3-tier serverless architecture** with 4 independent components:

```
┌─────────────┐    Schedule     ┌──────────────┐
│  Strava API │◄───────────────│   Worker     │
│  (External) │   every 6h     │  (Lambda)    │
└─────────────┘                └──────┬───────┘
                                      │ write
                               ┌──────▼───────┐
                               │   DynamoDB    │
                               │  (AWS Table)  │
                               └──────┬───────┘
                                      │ read
                               ┌──────▼───────┐     HTTPS      ┌──────────────┐
                               │   API        │◄───────────────│   Frontend   │
                               │  (Lambda)    │  Function URL  │  (Vercel)    │
                               └──────────────┘                └──────────────┘
```

### Component Details

| Component    | Runtime       | Deployment             | Entry Point                          |
|-------------|---------------|------------------------|--------------------------------------|
| **Worker**  | Python 3.12   | AWS Lambda + EventBridge (cron) | `worker/strava_retriever.py` → `retrieve_strava_data_lambda` |
| **API**     | Python 3.12   | AWS Lambda + Function URL (v2.0 payload format) | `api/backend_source.py` → `process_activities` |
| **Frontend**| React 19 + Vite 7 | Vercel (auto-deploy on push) | `frontend/src/main.jsx`              |
| **Database**| DynamoDB      | AWS (eu-west-1)        | Table: `Ride-The-Wave-Activities`    |

---

## 3. Directory Structure

```
strava-counter-ride-the-wave/
├── .github/workflows/
│   ├── deploy-api.yaml          # CI/CD: Deploy API Lambda on push to master (api/** changes only)
│   └── deploy-worker.yaml       # CI/CD: Deploy Worker Lambda on push to master (worker/** changes only)
│
├── api/                         # Backend API (Python, runs as AWS Lambda)
│   ├── backend_source.py        # Lambda handler + local Flask server
│   ├── config.py                # All env var loading with defaults
│   ├── auth.py                  # HMAC signature verification + Bearer token management
│   ├── rate_limiter.py          # In-memory sliding window rate limiter per IP
│   ├── database.py              # DynamoDB operations + fallback mock data
│   ├── services.py              # Business logic: activity aggregation, stats, weekly charts
│   ├── utils.py                 # JSON encoder, formatters (pace, duration)
│   └── .env                     # Local dev env vars (NOT deployed, excluded from zip)
│
├── worker/                      # Strava Data Retriever (Python, runs as AWS Lambda)
│   ├── strava_retriever.py      # Lambda handler
│   ├── config.py                # Env var loading (Strava creds, AWS config)
│   ├── strava_client.py         # Strava OAuth token refresh + activity fetching
│   ├── database.py              # DynamoDB write operations (conditional put)
│   ├── requirements.txt         # Python deps (requests, boto3)
│   └── .env                     # Local dev env vars (NOT deployed)
│
├── frontend/                    # React Dashboard (Vite)
│   ├── index.html               # HTML shell (Google Fonts: Inter + Racing Sans One)
│   ├── vite.config.js           # Vite config (React plugin only)
│   ├── package.json             # Deps: react 19, leaflet, react-leaflet, recharts
│   ├── .env.development         # Local API URL + dev auth keys
│   ├── .env.production          # Production Lambda URL + production auth keys
│   └── src/
│       ├── main.jsx             # React entry (StrictMode)
│       ├── App.jsx              # Root component: data fetching, caching, view routing
│       ├── App.css              # All component styles (glassmorphism, animations, cards)
│       ├── index.css            # Design system: CSS custom properties, global reset
│       ├── config.js            # API URL export, sport type config (icons, colors, labels)
│       ├── apiAuth.js           # Frontend HMAC signing + Bearer token management
│       ├── components/
│       │   ├── ProgressSection.jsx  # Goal progress bar with animated fill
│       │   ├── CombinedMap.jsx      # All-routes heatmap overlay (Leaflet)
│       │   ├── ActivityCarousel.jsx # Infinite scroll carousel with clone-based looping
│       │   ├── ActivityCard.jsx     # Individual activity card with route map
│       │   └── RouteMap.jsx         # Single-route Leaflet map (non-interactive)
│       └── utils/
│           └── helpers.js       # Polyline decoder, date/duration/pace/number formatters
│
├── scripts/                     # Local development utilities
│   ├── create_local_db.py       # Creates DynamoDB table in local Docker container
│   └── seed_local_db.py         # Seeds local DB with production data
│
├── docker-compose.yml           # Local DynamoDB container (port 8000)
├── .gitignore                   # Excludes: .env, __pycache__, node_modules, dist
└── README.md                    # Project overview and local dev instructions
```

---

## 4. Tech Stack & Dependencies

### Backend (API + Worker)
- **Language:** Python 3.12
- **AWS SDK:** `boto3` (DynamoDB interactions)
- **HTTP (Worker only):** `requests` (Strava API calls)
- **Local server:** `flask` + `flask-cors` (development only, not deployed)
- **Env loading:** `python-dotenv` (development only)

### Frontend
- **Framework:** React 19.2 with Vite 7.2
- **Maps:** Leaflet 1.9 + react-leaflet 5.0 (CartoDB Positron light tiles)
- **Charts:** Recharts 3.8 (available but not currently rendered in views)
- **Fonts:** Google Fonts — `Inter` (body), `Racing Sans One` (display headings)

### Infrastructure
- **Database:** AWS DynamoDB (single table: `Ride-The-Wave-Activities`, partition key: `activity_id` string)
- **Compute:** AWS Lambda (Python 3.12, eu-west-1)
- **API Gateway:** Lambda Function URL (payload format v2.0)
- **Frontend Hosting:** Vercel (auto-deploys from `master` branch)
- **CI/CD:** GitHub Actions (path-filtered deploys via `appleboy/lambda-action`)
- **Local DB:** Docker — `amazon/dynamodb-local:latest` on port 8000

---

## 5. Authentication System

The API uses a **two-step HMAC + Bearer token** authentication flow:

### Step 1 — Token Request (`POST /auth/token`)
The frontend sends an HMAC-SHA256 signed request:
```
Headers:
  X-Api-Key:    <API_KEY>
  X-Timestamp:  <unix_epoch_seconds>
  X-Nonce:      <crypto.randomUUID()>
  X-Signature:  HMAC-SHA256(API_SIGNING_SECRET, "{timestamp}.{nonce}")
```

The backend verifies:
1. `X-Api-Key` matches the configured `API_KEY`
2. Timestamp is within `AUTH_TOLERANCE_SECONDS` (default: 300s) of server time
3. HMAC signature is valid

If valid, returns a short-lived token (default TTL: 300s).

### Step 2 — Data Request (`GET /`)
```
Headers:
  Authorization: Bearer <token>
```
Token is validated against an **in-memory store** (`_active_tokens` dict in `auth.py`). Expired tokens are lazily cleaned up.

### Auth Passthrough Mode
If `API_KEY` or `API_SIGNING_SECRET` are empty/missing, **auth is completely disabled** (passthrough). This is the default for local development when env vars are not set.

### Frontend Auth Flow (`apiAuth.js`)
- Tokens are cached in `sessionStorage` with a 30-second safety buffer before expiry
- If no auth keys are configured (`VITE_API_KEY`, `VITE_API_SIGNING_SECRET`), the frontend sends requests with no `Authorization` header
- Uses Web Crypto API for HMAC-SHA256 signing (browser-native, no external crypto libs)

---

## 6. API Response Contract

`GET /` returns:

```json
{
  "total_km": 1234.56,
  "total_activities": 45,
  "total_elevation": 12345.6,
  "total_time_seconds": 123456,
  "total_time_display": "34h 17m",
  "total_kudos": 89,
  "filtered_km": 567.89,
  "matches_found": 20,
  "last_10_activities": [
    {
      "id": "12345678",
      "title": "Morning Run",
      "sport_type": "Run",
      "distance_km": 10.5,
      "moving_time_seconds": 3000,
      "moving_time_display": "50m",
      "total_elevation_gain": 45.2,
      "average_speed": 3.5,
      "max_speed": 4.8,
      "kudos_count": 5,
      "device_name": "Garmin Forerunner 965",
      "date": "2026-05-24T08:15:00Z",
      "date_local": "2026-05-24T10:15:00Z",
      "summary_polyline": "_p~iF~ps|U...",
      "pace": "4:46"
    }
  ],
  "all_polylines": ["encoded_polyline_1", "encoded_polyline_2"],
  "sport_breakdown": [
    { "sport": "Run", "count": 20, "distance_km": 200.5, "time_seconds": 60000, "time_display": "16h 40m", "elevation": 800.0 }
  ],
  "weekly_chart": [
    { "week": "2026-W20", "distance_km": 35.5, "count": 4 }
  ],
  "config": {
    "goal_km": 2000,
    "filter_word": "Ride"
  }
}
```

### Key Fields
- `filtered_km` and `matches_found` — filtered by the `TITLE_FILTER` env var (matches against `type` field)
- `last_10_activities` — the 10 most recent activities matching the filter, sorted newest-first
- `all_polylines` — all polylines from matching activities (used for the heatmap)
- `pace` field is only present for running activities

---

## 7. Design System & UI Conventions

### Color Palette
| Token                    | Value                  | Usage                       |
|--------------------------|------------------------|-----------------------------|
| `--strava-orange`        | `#62c0bb` (teal)       | Primary accent color        |
| `--strava-orange-light`  | `#82d0cc`              | Progress bar gradient end   |
| `--strava-orange-dark`   | `#43aaa4`              | Progress bar gradient start |
| `--bg-primary`           | `#f8fafc`              | Page background             |
| `--bg-secondary`         | `#ffffff`              | Card backgrounds            |
| `--text-primary`         | `#0f172a`              | Headings, main text         |
| `--text-secondary`       | `#475569`              | Body copy                   |
| `--text-muted`           | `#94a3b8`              | Labels, captions            |

> **Note:** Despite the CSS variable name `--strava-orange`, the actual color is **teal** `#62c0bb`, not orange.

### Sport Colors
| Sport    | Color     | Icon |
|----------|-----------|------|
| Run      | `#62c0bb` | 🏃   |
| Ride     | `#3b82f6` | 🚴   |
| Swim     | `#06b6d4` | 🏊   |
| Hike     | `#22c55e` | 🥾   |
| Walk     | `#84cc16` | 🚶   |
| Workout  | `#a855f7` | 💪   |
| Yoga     | `#ec4899` | 🧘   |
| Default  | `#62c0bb` | ⚡   |

### UI Patterns
- **Glassmorphism:** Cards use `rgba(255,255,255,0.8)` background + `backdrop-filter: blur(12px)` + subtle border/shadow
- **Border Radii:** `--radius-sm: 8px`, `--radius-md: 14px`, `--radius-lg: 20px`, `--radius-xl: 28px`
- **Animations:** `fadeInUp` entrance animation with staggered delays per child. Shimmer effect on progress bar
- **Maps:** CartoDB Positron (light) tiles — `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
- **Fonts:** `Racing Sans One` for display headings, `Inter` for everything else
- **Layout:** `#root` is 80% width, centered. Mobile breakpoint at 768px
- **Spanish UI Text:** The dashboard uses Spanish text for some labels ("Kilómetros recorridos", "Cada km recorrido se convierte en ayuda real")

---

## 8. Modular Widget Embed System

The dashboard supports **iframe-embeddable views** via query parameter:

| URL Parameter       | What Renders                                          |
|---------------------|-------------------------------------------------------|
| (none)              | Full dashboard: header, progress bar, heatmap, carousel |
| `?view=map`         | Header + progress bar + heatmap only                  |
| `?view=activities`  | Activity carousel only                                |

### Session-Based Caching
Both widgets share a **2-minute `sessionStorage` cache** (`strava_dashboard_data`). When embedding both `?view=map` and `?view=activities` iframes on the same parent page, only **1 API request** is made because they share the same session.

---

## 9. Environment Variables

### API Lambda (`api/.env` / Lambda console)

| Variable                | Required | Default                                          | Description                                |
|-------------------------|----------|--------------------------------------------------|--------------------------------------------|
| `DYNAMODB_TABLE_NAME`   | No       | `Ride-The-Wave-Activities`                       | DynamoDB table name                        |
| `AWS_REGION`            | No       | `eu-west-1`                                      | AWS region                                 |
| `USE_LOCAL_DB`          | No       | `false`                                          | Use local Docker DynamoDB                  |
| `LOCAL_DB_ENDPOINT`     | No       | `http://localhost:8000`                           | Local DynamoDB URL                         |
| `TITLE_FILTER`          | No       | `Run`                                            | Filter activities by sport type            |
| `GOAL_KM`              | No       | `500`                                            | Distance goal in km for progress bar       |
| `API_KEY`               | No*      | `''`                                             | API key for HMAC auth                      |
| `API_SIGNING_SECRET`    | No*      | `''`                                             | HMAC signing secret                        |
| `AUTH_TOLERANCE_SECONDS`| No       | `300`                                            | Max clock skew tolerance for timestamps    |
| `TOKEN_TTL_SECONDS`     | No       | `300`                                            | Bearer token lifetime                      |
| `RATE_LIMIT_MAX`        | No       | `30`                                             | Max requests per window per IP             |
| `RATE_LIMIT_WINDOW`     | No       | `60`                                             | Rate limit window in seconds               |
| `CORS_ALLOWED_ORIGINS`  | No       | `http://localhost:5173,http://127.0.0.1:5173`    | Comma-separated CORS origins               |

> \*If `API_KEY` or `API_SIGNING_SECRET` are empty, auth is **disabled** (passthrough mode).

### Worker Lambda (`worker/.env` / Lambda console)

| Variable                | Required | Description                                |
|-------------------------|----------|--------------------------------------------|
| `STRAVA_CLIENT_ID`      | Yes      | Strava OAuth app client ID                 |
| `STRAVA_CLIENT_SECRET`  | Yes      | Strava OAuth app client secret             |
| `STRAVA_REFRESH_TOKEN`  | Yes      | Long-lived refresh token for athlete       |
| `DYNAMODB_TABLE_NAME`   | No       | DynamoDB table name                        |
| `AWS_REGION`            | No       | AWS region (default: eu-west-1)            |
| `START_DATE`            | No       | Fetch activities from this date (DD/MM/YYYY). Default: last 7 days |

### Frontend (`frontend/.env.development` / `.env.production`)

| Variable                   | Required | Description                                |
|----------------------------|----------|--------------------------------------------|
| `VITE_API_URL`             | Yes      | Backend API base URL                       |
| `VITE_API_KEY`             | No*      | API key (must match backend `API_KEY`)     |
| `VITE_API_SIGNING_SECRET`  | No*      | Signing secret (must match backend)        |

> \*If empty, frontend runs in passthrough mode (no auth headers sent).

---

## 10. CI/CD & Deployment

### GitHub Actions Workflows

#### `deploy-api.yaml` — API Lambda
- **Triggers:** Push to `master`/`main` when `api/**` files change
- **Steps:** Checkout → Setup Python 3.12 → Zip `api/` folder (excluding `.env`) → Deploy to Lambda `RideTheWaveAPI` via `appleboy/lambda-action`
- **Secrets used:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

#### `deploy-worker.yaml` — Worker Lambda
- **Triggers:** Push to `master`/`main` when `worker/**` files change
- **Steps:** Checkout → Setup Python 3.12 → `pip install -r requirements.txt -t .` (installs deps alongside code) → Zip (excluding `.env`, `.git`, `__pycache__`) → Deploy to Lambda `RideTheWaveWorker`
- **Secrets used:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

### Frontend (Vercel)
- Auto-deploys from `master` branch
- Build command: `npm run build` from `frontend/` directory
- Environment variables (`VITE_*`) must be configured in the Vercel project settings

### ⚠️ CRITICAL: Lambda Environment Variables
**The CI/CD zip deploy DOES NOT include `.env` files** (they're explicitly excluded). All Lambda environment variables must be configured directly in the **AWS Lambda console** (or via AWS CLI/IaC). If you deploy code that changes `config.py` env var names, you must also update the Lambda console env vars manually.

The `appleboy/lambda-action` action **replaces the entire Lambda code package** on each deploy. It does NOT touch the Lambda configuration (env vars, memory, timeout, etc.), so existing env vars are preserved across code deploys.

---

## 11. DynamoDB Schema

**Table:** `Ride-The-Wave-Activities`
**Region:** eu-west-1
**Partition Key:** `activity_id` (String)

### Item Schema

| Field                    | Type     | Description                                       |
|--------------------------|----------|---------------------------------------------------|
| `activity_id`            | String   | Primary key — Strava activity ID                  |
| `title`                  | String   | Activity name/title                               |
| `sport_type`             | String   | Sport type (Run, Ride, Hike, etc.)                |
| `type`                   | String   | Activity type (usually same as sport_type)        |
| `distance_km`            | Number   | Distance in kilometers                            |
| `moving_time_seconds`    | Number   | Moving time in seconds                            |
| `elapsed_time_seconds`   | Number   | Total elapsed time (Worker only)                  |
| `total_elevation_gain`   | Number   | Elevation gain in meters                          |
| `start_date`             | String   | ISO 8601 UTC timestamp                            |
| `start_date_local`       | String   | ISO 8601 local time timestamp                     |
| `average_speed`          | Number   | Average speed in m/s                              |
| `max_speed`              | Number   | Max speed in m/s                                  |
| `kudos_count`            | Number   | Number of kudos                                   |
| `achievement_count`      | Number   | Number of achievements (Worker only)              |
| `summary_polyline`       | String   | Google encoded polyline of the route              |

### Write Logic (Worker)
- Activities **without a valid polyline** are discarded (no route = not saved)
- Uses `ConditionExpression: attribute_not_exists(activity_id)` to prevent overwrites

---

## 12. Local Development

### Prerequisites
- Python 3.12+
- Node.js 18+
- Docker Desktop (for local DynamoDB)

### Startup Sequence

```bash
# 1. Start local DynamoDB (Docker)
docker compose up -d

# 2. Create the table (first time only)
cd scripts && python create_local_db.py

# 3. Seed with production data (optional)
python seed_local_db.py

# 4. Start the backend API (separate terminal)
cd api
pip install flask flask-cors boto3 python-dotenv
python backend_source.py
# → Runs at http://127.0.0.1:5000

# 5. Start the frontend (separate terminal)
cd frontend
npm install
npm run dev
# → Runs at http://localhost:5173
```

### Local Auth
Local dev uses matching keys in `api/.env` and `frontend/.env.development`:
- API Key: `dev-local-key-12345`
- Signing Secret: `dev-local-secret-abcdef0123456789`

### Fallback Data
When the API can't connect to DynamoDB (local or production), it:
1. First tries to fetch live data from the production Lambda URL
2. If that also fails, returns **hardcoded mock activities** with valid Barcelona/Madrid GPS polylines

---

## 13. Known Gotchas & Common Pitfalls

### Lambda Payload Format
The API Lambda uses **Function URL payload format v2.0**. The handler code supports both v1.0 and v2.0 formats for backwards compatibility:
- Path: `event.rawPath` (v2.0) or `event.path` (v1.0)
- Method: `event.requestContext.http.method` (v2.0) or `event.httpMethod` (v1.0)
- Client IP: `event.requestContext.http.sourceIp` (v2.0) or `event.requestContext.identity.sourceIp` (v1.0)

### In-Memory State (Lambda Cold Starts)
`auth.py` stores active tokens in `_active_tokens` dict and `rate_limiter.py` stores request history in `_request_history` dict. Both are **in-memory** and reset on Lambda cold starts. This means:
- Tokens issued by one Lambda instance may not be valid on another
- Rate limits reset on cold starts
- This is acceptable for the current single-user use case

### CORS Configuration
- The Lambda handler adds CORS headers to **every response** (including errors)
- CORS origin is resolved from the `Origin` request header, defaulting to `*`
- For local dev, `CORS_ALLOWED_ORIGINS` must include `http://localhost:5173`

### Leaflet in React 18 StrictMode
React 18 StrictMode double-mounts effects. The Leaflet map components handle this by clearing `container.innerHTML = ''` before initializing and properly cleaning up in the return function.

### Frontend `.env` files ARE committed to git
`frontend/.env.development` and `frontend/.env.production` are tracked in git (they contain `VITE_*` build-time variables). The `api/.env` and `worker/.env` are **not deployed** (excluded from Lambda zips) but are committed to git for convenience. **Be careful not to commit real AWS credentials.**

---

## 14. Branching & Workflow Conventions

- **`master`** is the production branch. All merges go here.
- Feature branches use the pattern: `feature/<descriptive-name>` (e.g., `feature/api-auth-system`, `feature/map-cleanup-counter-top`)
- CI/CD only triggers on push to `master`/`main`
- Keep changes to `api/`, `worker/`, and `frontend/` in separate commits when possible to avoid triggering unnecessary Lambda deploys

---

## 15. Forking Guide

If you fork this project to track a different athlete or customize the dashboard:

1. **Strava Setup:** Create a Strava API application at `https://www.strava.com/settings/api`. Get your `client_id`, `client_secret`, and `refresh_token`.
2. **AWS Setup:** Create a DynamoDB table named `Ride-The-Wave-Activities` (or customize via env var) with `activity_id` (String) as partition key in your desired region.
3. **Worker Lambda:** Create a Lambda function, set the env vars from Section 9, and configure an EventBridge rule to trigger it periodically.
4. **API Lambda:** Create a Lambda function with a Function URL (v2.0 payload format). Set the env vars. Set handler to `backend_source.process_activities`.
5. **Frontend:** Update `.env.production` with your Lambda Function URL and auth keys. Deploy to Vercel (or any static hosting).
6. **Auth Keys:** Generate your own `API_KEY` and `API_SIGNING_SECRET` and configure them in both the API Lambda env vars and `frontend/.env.production`.
7. **Customize:** Change `TITLE_FILTER` (e.g., `Run`, `Ride`) and `GOAL_KM` to match your goals.
