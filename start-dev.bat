@echo off
echo Starting MCP Frontend and Backend...
echo.

echo Starting Backend (FastAPI)...
start "MCP Backend" cmd /c "cd /d .. && python cli1.py"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend (React)...
start "MCP Frontend" cmd /c "npm run dev"

echo.
echo Both servers should be starting up:
echo - Backend: http://127.0.0.1:8080
echo - Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul
