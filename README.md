# AgriLens.AI

Full-stack demo for plant disease diagnosis (FastAPI backend + React frontend).

## Prerequisites
- Python 3.10+
- Node.js 18+ and Yarn 1 (or npm)

## Backend (FastAPI)
1. Create venv and install deps:
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-minimal.txt
```
2. Run server:
```bash
python server.py  # serves on http://localhost:8001
```
3. Verify health:
```bash
curl http://localhost:8001/api/health
```

## Frontend (React + CRACO + Tailwind)
1. Install deps:
```bash
cd ../frontend
yarn install
```
2. Configure backend URL (optional):
```bash
cp .env.example .env  # edit REACT_APP_BACKEND_URL if not localhost:8001
```
3. Start dev server:
```bash
yarn start
```
Open http://localhost:3000 and run a diagnosis on the Diagnosis page.

## Build
```bash
cd frontend
yarn build
```

## Notes
- CORS is enabled wide-open for local/dev.
- Model is a sophisticated mock; no GPU required.
# Here are your Instructions
