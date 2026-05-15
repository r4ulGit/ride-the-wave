# 🌊 Strava Counter — Ride the Wave

Athlete activity tracker that fetches individual Strava athlete data, stores it in AWS DynamoDB, and displays it on a premium web dashboard.

## Project Structure

```
strava-counter-ride-the-wave/
│
├── .github/
│   └── workflows/
│       ├── deploy-worker.yaml   # Deploy Strava data retriever Lambda
│       └── deploy-api.yaml      # Deploy backend API Lambda
│
├── worker/
│   ├── config.py                # Environment variables & constants
│   ├── strava_client.py         # Strava OAuth & API client
│   ├── database.py              # DynamoDB operations
│   └── strava_retriever.py      # Lambda handler (main entry point)
│
├── api/
│   └── backend_source.py        # Read & process data from DynamoDB for the frontend
│
└── frontend/
    ├── public/
    ├── src/
    │   └── App.jsx              # Main React dashboard
    ├── package.json
    └── ...
```

## Components

### Worker (Data Retriever)
- Runs as an AWS Lambda on a schedule (e.g., every 6 hours via EventBridge)
- Refreshes Strava OAuth token
- Fetches athlete activities via `GET /api/v3/athlete/activities`
- Stores new activities in DynamoDB (skips duplicates)

### API (Backend)
- AWS Lambda with Function URL
- Reads all activities from DynamoDB
- Aggregates stats: total distance, per-sport breakdown, weekly trends
- Returns processed JSON for the frontend

### Frontend (Dashboard)
- React + Vite
- Premium dark-themed dashboard
- Displays: total stats, sport breakdown, progress bar, recent activities
- Widget mode support via `?mode=widget`

## Local Development

### Worker
```bash
cd worker
pip install -r requirements.txt
python strava_retriever.py
```

### API
```bash
cd api
pip install flask flask-cors boto3 python-dotenv
python backend_source.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
