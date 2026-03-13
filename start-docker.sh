#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  MedAI — One-Command Docker Start
#  Builds & launches: Frontend + Backend + ngrok tunnel
#
#  Usage:
#    chmod +x start-docker.sh
#    ./start-docker.sh
# ═══════════════════════════════════════════════════════════════
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}    MedAI Healthcare Platform — Docker Launcher${NC}"
echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════════${NC}"
echo ""

# ── 1. Check Docker is installed & running ──
if ! command -v docker &>/dev/null; then
  echo -e "${RED}Docker not found. Install Docker Desktop: https://docker.com/get-started${NC}"
  exit 1
fi

if ! docker info &>/dev/null 2>&1; then
  echo -e "${YELLOW}Docker daemon is not running. Starting Docker Desktop...${NC}"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open -a Docker
    echo "  Waiting for Docker to start (this may take 30–60 seconds)..."
    for i in $(seq 1 60); do
      if docker info &>/dev/null 2>&1; then
        echo -e "  ${GREEN}Docker is ready.${NC}"
        break
      fi
      sleep 2
    done
    if ! docker info &>/dev/null 2>&1; then
      echo -e "${RED}Docker did not start in time. Please start Docker Desktop manually.${NC}"
      exit 1
    fi
  else
    echo -e "${RED}Please start Docker manually and re-run this script.${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}Docker is running.${NC}"

# ── 2. Create server/.env if it doesn't exist ──
if [ ! -f "$ROOT_DIR/server/.env" ]; then
  echo -e "${YELLOW}Creating server/.env from template...${NC}"
  cp "$ROOT_DIR/server/.env.example" "$ROOT_DIR/server/.env"
  # Auto-generate a stable JWT secret
  JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || echo "medai-docker-secret-$(date +%s)")
  sed -i.bak "s|JWT_SECRET=your-jwt-secret-here|JWT_SECRET=${JWT_SECRET}|" "$ROOT_DIR/server/.env"
  rm -f "$ROOT_DIR/server/.env.bak"
  echo -e "  ${GREEN}Auto-generated JWT secret.${NC}"
  echo -e "  ${YELLOW}No OpenAI API key set. Add it after login via Settings page.${NC}"
else
  echo -e "${GREEN}server/.env exists.${NC}"
fi

# ── 3. Check ngrok auth token ──
if [ -z "${NGROK_AUTHTOKEN:-}" ]; then
  # Try to read from root .env
  if [ -f "$ROOT_DIR/.env" ] && grep -q "NGROK_AUTHTOKEN" "$ROOT_DIR/.env"; then
    export $(grep "NGROK_AUTHTOKEN" "$ROOT_DIR/.env" | head -1 | xargs)
  fi
fi

if [ -z "${NGROK_AUTHTOKEN:-}" ]; then
  echo ""
  echo -e "${YELLOW}ngrok auth token not found.${NC}"
  echo -e "  The app will work locally at ${CYAN}http://localhost${NC}, but won't be"
  echo -e "  accessible from the internet without an ngrok token."
  echo ""
  echo -e "  To get one: ${CYAN}https://dashboard.ngrok.com/get-started/your-authtoken${NC}"
  echo -e "  Then set it:  ${CYAN}export NGROK_AUTHTOKEN=your_token_here${NC}"
  echo -e "  Or add to .env: ${CYAN}NGROK_AUTHTOKEN=your_token_here${NC}"
  echo ""
  echo -e "  ${BOLD}Continuing without ngrok...${NC}"
  # Start without the ngrok service
  COMPOSE_PROFILES=""
else
  echo -e "${GREEN}ngrok auth token found.${NC}"
  COMPOSE_PROFILES="ngrok"
fi

# ── 4. Build & Start ──
echo ""
echo -e "${CYAN}Building and starting containers...${NC}"
echo ""

if [ -n "${NGROK_AUTHTOKEN:-}" ]; then
  docker compose up --build -d
else
  # Start only frontend + backend (skip ngrok)
  docker compose up --build -d frontend backend
fi

echo ""

# ── 5. Wait for services to be healthy ──
echo -e "${CYAN}Waiting for services to start...${NC}"
for i in $(seq 1 30); do
  if curl -s http://localhost:8000/api/health &>/dev/null; then
    break
  fi
  sleep 2
done

if curl -s http://localhost:8000/api/health &>/dev/null; then
  echo -e "${GREEN}Backend is healthy.${NC}"
else
  echo -e "${RED}Backend did not start. Check logs: docker compose logs backend${NC}"
fi

if curl -s http://localhost &>/dev/null; then
  echo -e "${GREEN}Frontend is healthy.${NC}"
else
  echo -e "${YELLOW}Frontend may still be starting. Check: docker compose logs frontend${NC}"
fi

echo ""
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}    MedAI is running!${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Local:        ${CYAN}${BOLD}http://localhost${NC}"
echo -e "  API:          ${CYAN}http://localhost:8000${NC}"
echo -e "  API Docs:     ${CYAN}http://localhost:8000/docs${NC}"

# ── 6. Show ngrok URL if available ──
if [ -n "${NGROK_AUTHTOKEN:-}" ]; then
  echo ""
  echo -e "  ${CYAN}Fetching ngrok public URL...${NC}"
  sleep 3
  NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for t in data.get('tunnels', []):
        print(t['public_url'])
        break
except: pass
" 2>/dev/null || echo "")

  if [ -n "$NGROK_URL" ]; then
    echo -e "  Public URL:   ${GREEN}${BOLD}${NGROK_URL}${NC}"
    echo -e "  Inspector:    ${CYAN}http://localhost:4040${NC}"
  else
    echo -e "  ${YELLOW}ngrok URL not ready yet. Check: http://localhost:4040${NC}"
  fi
fi

echo ""
echo -e "  Login:  ${BOLD}admin@medai.com${NC} / ${BOLD}admin123${NC}"
echo -e "  Then go to ${BOLD}Settings${NC} and paste your OpenAI API key."
echo ""
echo -e "  ${CYAN}Logs:${NC}   docker compose logs -f"
echo -e "  ${CYAN}Stop:${NC}   docker compose down"
echo ""
