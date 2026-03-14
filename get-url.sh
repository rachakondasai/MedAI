#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  MedAI — Get your current public ngrok URL
#  Usage: ./get-url.sh
# ═══════════════════════════════════════════════════════════════

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for t in data.get('tunnels', []):
        print(t['public_url'])
        break
except: pass
" 2>/dev/null)

if [ -n "$URL" ]; then
  echo ""
  echo -e "  ${GREEN}${BOLD}MedAI is live!${NC}"
  echo -e "  ${CYAN}${BOLD}$URL${NC}"
  echo ""
  echo -e "  Local:     ${CYAN}http://localhost${NC}"
  echo -e "  Inspector: ${CYAN}http://localhost:4040${NC}"
  echo ""
else
  echo ""
  echo -e "  ${RED}ngrok tunnel not running.${NC}"
  echo -e "  Start it: ${CYAN}cd \"$(dirname "$0")\" && docker compose up -d${NC}"
  echo ""
fi
