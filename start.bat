@echo off
echo =========================================================
echo Starting AI-Assisted Digital Wallet Analyzer
echo =========================================================

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Wallet Analyzer - Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 2 >nul

echo [2/2] Starting React + Vite Frontend on http://localhost:5173 ...
start "Wallet Analyzer - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are starting up!
echo - Frontend Dashboard: http://localhost:5173
echo - Backend Swagger Docs: http://127.0.0.1:8000/docs
echo =========================================================
