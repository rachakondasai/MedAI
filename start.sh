#!/usr/bin/env bash
# ============================================================
# MedAI — One-command start script
# Usage:  chmod +x start.sh && ./start.sh
# ============================================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║          MedAI Healthcare SaaS Platform          ║"
echo "║     AI Doctor · Reports · Hospitals · Vitals     ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# -------------------------------------------
# 1. Install Node.js dependencies
# -------------------------------------------
echo "📦 [1/4] Installing frontend dependencies..."
cd "$ROOT_DIR"
if [ ! -d "node_modules" ]; then
  npm install
else
  echo "   → node_modules already exists, skipping."
fi

# -------------------------------------------
# 2. Set up Python virtual environment
# -------------------------------------------
echo ""
echo "🐍 [2/4] Setting up Python backend..."
cd "$SERVER_DIR"

if [ ! -d "venv" ]; then
  echo "   → Creating Python virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate

echo "   → Installing Python packages..."
pip install -q -r requirements.txt

# -------------------------------------------
# 3. Create .env if it doesn't exist
# -------------------------------------------
echo ""
echo "🔑 [3/4] Checking environment..."
if [ ! -f "$SERVER_DIR/.env" ]; then
  cp "$SERVER_DIR/.env.example" "$SERVER_DIR/.env"
  echo "   → Created server/.env from template."
  echo "   → ⚠️  No OpenAI API key set. Add it via Settings page in the dashboard."
else
  echo "   → server/.env already exists."
fi

# -------------------------------------------
# 4. Start both servers
# -------------------------------------------
echo ""
echo "🚀 [4/4] Starting MedAI..."
echo ""
echo "   Frontend → http://localhost:5173"
echo "   Backend  → http://localhost:8000"
echo "   API Docs → http://localhost:8000/docs"
echo ""
echo "   📌 First time? Log in with: admin@medai.com / admin123"
echo "   📌 Then go to Settings → paste your OpenAI API key"
echo ""
echo "   Press Ctrl+C to stop both servers."
echo ""

cd "$ROOT_DIR"

# Use concurrently if available, otherwise use background processes
if npx --no-install concurrently --version > /dev/null 2>&1; then
  npx concurrently \
    --names "FRONTEND,BACKEND" \
    --prefix-colors "cyan,green" \
    "npm run dev" \
    "cd server && source venv/bin/activate && python main.py"
else
  # Fallback: run both in background
  echo "Starting backend..."
  cd "$SERVER_DIR"
  source venv/bin/activate
  python main.py &
  BACKEND_PID=$!

  echo "Starting frontend..."
  cd "$ROOT_DIR"
  npm run dev &
  FRONTEND_PID=$!

  # Trap Ctrl+C to kill both
  trap "echo ''; echo 'Stopping MedAI...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

  wait
fi
