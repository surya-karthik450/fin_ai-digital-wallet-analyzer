Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " Starting AI-Assisted Digital Wallet Analyzer" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan

Write-Host "`n[1/2] Launching Backend (FastAPI on port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/backend'; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 2

Write-Host "[2/2] Launching Frontend (Vite on port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/frontend'; npm run dev"

Write-Host "`nReady!" -ForegroundColor Green
Write-Host "- Frontend UI: http://localhost:5173" -ForegroundColor White
Write-Host "- Backend API: http://127.0.0.1:8000/docs" -ForegroundColor White
