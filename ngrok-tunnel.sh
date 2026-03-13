#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  MedAI — ngrok Tunnel Launcher
#  Exposes both the React frontend (5173) and FastAPI backend (8000) publicly
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}  🏥 MedAI — ngrok Tunnel Setup${NC}"
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

# ── 1. Check ngrok is installed ──────────────────────────────────────────────
if ! command -v ngrok &> /dev/null; then
  echo -e "${RED}✗ ngrok not found!${NC}"
  echo ""
  echo "  Install it with one of:"
  echo -e "    ${YELLOW}brew install ngrok${NC}              (macOS)"
  echo -e "    ${YELLOW}npm install -g ngrok${NC}            (npm)"
  echo -e "    ${YELLOW}https://ngrok.com/download${NC}      (manual)"
  echo ""
  echo "  Then authenticate:"
  echo -e "    ${YELLOW}ngrok config add-authtoken YOUR_TOKEN${NC}"
  echo ""
  exit 1
fi

echo -e "${GREEN}✓ ngrok found: $(ngrok version)${NC}"

# ── 2. Check that frontend & backend are running ────────────────────────────
check_port() {
  lsof -iTCP:"$1" -sTCP:LISTEN &>/dev/null
}

if ! check_port 5173; then
  echo -e "${YELLOW}⚠ Frontend (port 5173) not running.${NC}"
  echo -e "  Start it with: ${CYAN}npm run dev${NC}"
fi

if ! check_port 8000; then
  echo -e "${YELLOW}⚠ Backend (port 8000) not running.${NC}"
  echo -e "  Start it with: ${CYAN}cd server && python main.py${NC}"
fi

echo ""

# ── 3. Launch tunnels ───────────────────────────────────────────────────────
# Use ngrok's built-in config to open multiple tunnels simultaneously.
# We write a temporary ngrok config with both tunnels.

NGROK_CONFIG_FILE="/tmp/ngrok-medai-$$.yml"
rm -f "$NGROK_CONFIG_FILE"

# Detect default ngrok config path (contains authtoken)
NGROK_DEFAULT_CONFIG="$HOME/Library/Application Support/ngrok/ngrok.yml"
if [ ! -f "$NGROK_DEFAULT_CONFIG" ]; then
  NGROK_DEFAULT_CONFIG="$HOME/.config/ngrok/ngrok.yml"
fi
if [ ! -f "$NGROK_DEFAULT_CONFIG" ]; then
  NGROK_DEFAULT_CONFIG="$HOME/.ngrok2/ngrok.yml"
fi

cat > "$NGROK_CONFIG_FILE" <<EOF
version: "3"
tunnels:
  frontend:
    addr: 5173
    proto: http
    inspect: false
  backend:
    addr: 8000
    proto: http
    inspect: false
EOF

echo -e "${CYAN}Starting ngrok tunnels for:${NC}"
echo -e "  📱 Frontend → ${BOLD}http://localhost:5173${NC}"
echo -e "  ⚙️  Backend  → ${BOLD}http://localhost:8000${NC}"
echo ""

# Start ngrok with BOTH configs: default (authtoken) + our tunnels
ngrok start --config "$NGROK_DEFAULT_CONFIG" --config "$NGROK_CONFIG_FILE" --all &
NGROK_PID=$!

# Wait for tunnels to be ready
echo -e "${YELLOW}Waiting for ngrok tunnels to start...${NC}"
sleep 3

# ── 4. Fetch tunnel URLs from ngrok API ─────────────────────────────────────
TUNNELS_JSON=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null || echo "")

if [ -z "$TUNNELS_JSON" ] || [ "$TUNNELS_JSON" = "" ]; then
  echo -e "${RED}✗ Could not reach ngrok API at http://127.0.0.1:4040${NC}"
  echo -e "  ngrok might still be starting. Try: ${CYAN}curl http://127.0.0.1:4040/api/tunnels${NC}"
  echo ""
  echo -e "  ngrok PID: $NGROK_PID — kill it with: ${YELLOW}kill $NGROK_PID${NC}"
  wait $NGROK_PID 2>/dev/null
  exit 1
fi

# Parse URLs
FRONTEND_URL=$(echo "$TUNNELS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for t in data.get('tunnels', []):
    if str(t.get('config', {}).get('addr', '')).endswith('5173'):
        print(t['public_url'])
        break
" 2>/dev/null || echo "")

BACKEND_URL=$(echo "$TUNNELS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for t in data.get('tunnels', []):
    if str(t.get('config', {}).get('addr', '')).endswith('8000'):
        print(t['public_url'])
        break
" 2>/dev/null || echo "")

echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  ✅ ngrok Tunnels Active!${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ -n "$FRONTEND_URL" ]; then
  echo -e "  📱 ${BOLD}Frontend:${NC}  ${CYAN}${FRONTEND_URL}${NC}"
else
  echo -e "  📱 ${BOLD}Frontend:${NC}  ${YELLOW}(not detected — check http://127.0.0.1:4040)${NC}"
fi

if [ -n "$BACKEND_URL" ]; then
  echo -e "  ⚙️  ${BOLD}Backend:${NC}   ${CYAN}${BACKEND_URL}${NC}"
  echo -e "  📚 ${BOLD}API Docs:${NC}  ${CYAN}${BACKEND_URL}/docs${NC}"
else
  echo -e "  ⚙️  ${BOLD}Backend:${NC}   ${YELLOW}(not detected — check http://127.0.0.1:4040)${NC}"
fi

echo ""
echo -e "  🔍 ${BOLD}Inspector:${NC} ${CYAN}http://127.0.0.1:4040${NC}"
echo ""

# ── 5. Important: Update .env ───────────────────────────────────────────────
if [ -n "$BACKEND_URL" ]; then
  echo -e "${YELLOW}${BOLD}⚠ IMPORTANT — Update your .env to point to the backend tunnel:${NC}"
  echo ""
  echo -e "  ${CYAN}VITE_API_URL=${BACKEND_URL}${NC}"
  echo ""
  echo -e "  Then restart the frontend: ${CYAN}npm run dev${NC}"
  echo ""

  # Auto-update .env if user wants
  read -p "  Auto-update .env now? (y/N) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    ENV_FILE="$(dirname "$0")/.env"
    if [ -f "$ENV_FILE" ]; then
      # Replace or append VITE_API_URL
      if grep -q "^VITE_API_URL=" "$ENV_FILE"; then
        sed -i.bak "s|^VITE_API_URL=.*|VITE_API_URL=${BACKEND_URL}|" "$ENV_FILE"
      else
        echo "VITE_API_URL=${BACKEND_URL}" >> "$ENV_FILE"
      fi
      echo -e "  ${GREEN}✓ Updated .env with VITE_API_URL=${BACKEND_URL}${NC}"
      echo -e "  ${YELLOW}→ Restart frontend for changes to take effect: npm run dev${NC}"
    else
      echo -e "  ${RED}✗ .env file not found at ${ENV_FILE}${NC}"
    fi
  fi
fi

echo ""
echo -e "${CYAN}Press Ctrl+C to stop ngrok tunnels.${NC}"
echo ""

# ── 6. Cleanup on exit ─────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down ngrok...${NC}"
  kill $NGROK_PID 2>/dev/null
  rm -f "$NGROK_CONFIG_FILE"

  # Restore .env to localhost
  ENV_FILE="$(dirname "$0")/.env"
  if [ -f "$ENV_FILE" ] && grep -q "ngrok" "$ENV_FILE"; then
    sed -i.bak "s|^VITE_API_URL=.*|VITE_API_URL=http://localhost:8000|" "$ENV_FILE"
    echo -e "${GREEN}✓ Restored .env to http://localhost:8000${NC}"
  fi

  echo -e "${GREEN}Done.${NC}"
}

trap cleanup EXIT INT TERM

# Keep script alive
wait $NGROK_PID 2>/dev/null
