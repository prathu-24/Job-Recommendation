@echo off
title Job Recommendation System Launcher

echo ==============================================
echo  Launching FastAPI Backend...
echo ==============================================
start cmd /k "cd backend && .\venv\Scripts\activate.bat && uvicorn app.main:app --reload"

echo ==============================================
echo  Launching React Frontend...
echo ==============================================
start cmd /k "cd frontend && npm run dev"

echo ==============================================
echo  Both services launched successfully!
echo  - Frontend Client: http://localhost:5173
echo  - Backend API Swagger: http://localhost:8000/docs
echo ==============================================
pause
