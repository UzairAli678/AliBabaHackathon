# CareLedger AI

CareLedger AI is an AI-assisted healthcare app that guides users from symptoms to diagnosis to hospital and cost comparison, then into treatment tracking.

## Monorepo structure

- `/frontend` — React Native (Expo) mobile app scaffold.
- `/backend` — FastAPI service with mock feature endpoints.

## Frontend

```bash
cd frontend
npm install
npx expo start
```

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Backend mock routes

- `/health-assessment`
- `/smart-care-navigator`
- `/medical-cost-intelligence`
- `/treatment-affordability-score`
- `/appointments`
- `/ai-chat`
- `/health-roadmap`
