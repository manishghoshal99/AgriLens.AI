# Local Testing Guide for AgriLens.AI

## Prerequisites
- Python 3.9+
- Node.js 18+

## Step 1: Run the Backend
1. Open a terminal.
2. Navigate to the `api` directory:
   ```bash
   cd api
   ```
3. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Start the server:
   ```bash
   uvicorn server:app --reload --port 8001
   ```
   The backend will run at `http://localhost:8001`.

## Step 2: Run the Frontend
1. Open a **new** terminal.
2. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm start
   ```
   The frontend will open at `http://localhost:3000`.

## Verification
- Open `http://localhost:3000` in your browser.
- Upload an image or use a URL.
- The frontend will communicate with the backend at `localhost:8001`.
