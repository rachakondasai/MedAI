@echo off
REM ═══════════════════════════════════════════════════════════════
REM  MedAI — One-Command Docker Start (Windows)
REM  Builds & launches: Frontend + Backend + ngrok tunnel
REM
REM  Usage:   start-docker.bat
REM ═══════════════════════════════════════════════════════════════

echo.
echo ══════════════════════════════════════════════════════
echo     MedAI Healthcare Platform — Docker Launcher
echo ══════════════════════════════════════════════════════
echo.

REM 1. Check Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running.
    echo         Please start Docker Desktop and re-run this script.
    echo         Download: https://docker.com/get-started
    pause
    exit /b 1
)
echo [OK] Docker is running.

REM 2. Create server/.env if needed
if not exist "server\.env" (
    copy "server\.env.example" "server\.env"
    echo [INFO] Created server\.env from template.
    echo        No OpenAI API key set — add it via Settings page after login.
) else (
    echo [OK] server\.env exists.
)

REM 3. Build and start
echo.
echo Building and starting containers...
echo.

if defined NGROK_AUTHTOKEN (
    docker compose up --build -d
) else (
    echo [INFO] NGROK_AUTHTOKEN not set — starting without ngrok.
    echo        App will be available locally at http://localhost
    echo        To enable ngrok: set NGROK_AUTHTOKEN=your_token_here
    docker compose up --build -d frontend backend
)

echo.
echo Waiting for services to start...
timeout /t 10 /nobreak > nul

echo.
echo ══════════════════════════════════════════════════════
echo     MedAI is running!
echo ══════════════════════════════════════════════════════
echo.
echo   Local:      http://localhost
echo   API:        http://localhost:8000
echo   API Docs:   http://localhost:8000/docs
echo.
echo   Login:      admin@medai.com / admin123
echo   Then go to Settings and paste your OpenAI API key.
echo.
echo   Logs:       docker compose logs -f
echo   Stop:       docker compose down
echo.

if defined NGROK_AUTHTOKEN (
    echo   Public URL: Check http://localhost:4040
)

pause
