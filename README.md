# Perfume Recommender

AI-powered perfume discovery app with a React frontend and FastAPI backend.

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` in the project root and set your `GROQ_API_KEY`.

```bash
uvicorn main:app --reload --app-dir backend
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Data

Perfume data lives in `backend/data/`. Run `build_perfumes.py` to regenerate `perfumes.json` from `fra_cleaned.csv` if needed.
