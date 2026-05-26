#!/bin/bash
set -e

echo "=== Scentique — AI Perfume Recommender ==="
echo ""

# Check for .env
if [ ! -f ".env" ]; then
  echo "ERROR: .env file not found."
  echo "Copy .env.example to .env and add your GROQ_API_KEY"
  echo "  cp .env.example .env"
  exit 1
fi

# Backend
echo ">> Starting backend..."
cd backend
if [ ! -d "venv" ]; then
  echo "   Creating Python virtual environment..."
  python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
export $(cat ../.env | xargs)
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
deactivate
cd ..

# Frontend
echo ">> Starting frontend..."
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✦ Scentique is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" INT TERM
wait $BACKEND_PID $FRONTEND_PID
