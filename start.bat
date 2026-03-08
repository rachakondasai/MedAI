@echo off
REM ============================================================
REM MedAI — One-command start script (Windows)
REM Usage:  start.bat
REM ============================================================

echo.
echo ========================================================
echo          MedAI Healthcare SaaS Platform
echo     AI Doctor - Reports - Hospitals - Vitals
echo ========================================================
echo.

REM 1. Install Node.js dependencies
echo [1/4] Installing frontend dependencies...
if not exist "node_modules" (
    npm install
) else (
    echo    node_modules already exists, skipping.
)

REM 2. Set up Python virtual environment
echo.
echo [2/4] Setting up Python backend...
cd server

if not exist "venv" (
    echo    Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
echo    Installing Python packages...
pip install -q -r requirements.txt

REM 3. Create .env if it doesn't exist
echo.
echo [3/4] Checking environment...
if not exist ".env" (
    copy .env.example .env
    echo    Created server\.env from template.
    echo    WARNING: No OpenAI API key set. Add it via Settings page.
) else (
    echo    server\.env already exists.
)

cd ..

REM 4. Start both servers
echo.
echo [4/4] Starting MedAI...
echo.
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo    First time? Log in with: admin@medai.com / admin123
echo    Then go to Settings and paste your OpenAI API key.
echo.

start "MedAI Backend" cmd /c "cd server && venv\Scripts\activate.bat && python main.py"
timeout /t 2 /nobreak > nul
npm run dev
