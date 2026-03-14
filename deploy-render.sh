#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  MedAI — Deploy to Render.com (Free, Always-On, Permanent URL)
#
#  This script helps you deploy MedAI to Render.com so it's
#  accessible 24/7 even when your local machine is off.
#
#  Prerequisites:
#    1. A GitHub repo with your MedAI code pushed
#    2. A Render.com account (free): https://render.com
#
#  Usage: ./deploy-render.sh
# ═══════════════════════════════════════════════════════════════
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}    MedAI — Deploy to Render.com (Always-On)${NC}"
echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  This will deploy MedAI to Render.com so your app is"
echo -e "  ${GREEN}always accessible${NC} — even when your Mac is off."
echo ""
echo -e "  You'll get a permanent URL like:"
echo -e "  ${CYAN}${BOLD}https://medai-healthcare.onrender.com${NC}"
echo ""

echo -e "${YELLOW}${BOLD}Step 1: Make sure your code is on GitHub${NC}"
echo ""

# Check if repo is pushed
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -n "$REMOTE_URL" ]; then
  echo -e "  ${GREEN}GitHub repo found:${NC} $REMOTE_URL"
else
  echo -e "  ${RED}No git remote found.${NC}"
  echo -e "  Push your code to GitHub first:"
  echo -e "  ${CYAN}git remote add origin https://github.com/YOUR_USERNAME/MedAI.git${NC}"
  echo -e "  ${CYAN}git push -u origin main${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}${BOLD}Step 2: Deploy on Render.com${NC}"
echo ""
echo -e "  Option A — One-click deploy (easiest):"
echo ""
echo -e "    ${CYAN}${BOLD}https://render.com/deploy?repo=${REMOTE_URL}${NC}"
echo ""
echo -e "  Option B — Manual setup:"
echo ""
echo -e "    1. Go to ${CYAN}https://dashboard.render.com/new/web-service${NC}"
echo -e "    2. Connect your GitHub repo"
echo -e "    3. Set these options:"
echo -e "       • Runtime:        ${BOLD}Docker${NC}"
echo -e "       • Dockerfile:     ${BOLD}Dockerfile.render${NC}"
echo -e "       • Plan:           ${BOLD}Free${NC}"
echo -e "    4. Add Environment Variables:"
echo -e "       • ${BOLD}JWT_SECRET${NC}      = medai-production-jwt-secret-key-2024"
echo -e "       • ${BOLD}OPENAI_API_KEY${NC}  = (your OpenAI key, or leave blank — users add it in Settings)"
echo -e "       • ${BOLD}PORT${NC}            = 10000"
echo -e "    5. Click ${GREEN}${BOLD}Create Web Service${NC}"
echo ""

echo -e "${YELLOW}${BOLD}Step 3: Wait for deployment (3-5 minutes)${NC}"
echo ""
echo -e "  Render will build the Docker image and start your app."
echo -e "  Your permanent URL will be:"
echo -e "  ${GREEN}${BOLD}https://medai-healthcare.onrender.com${NC}"
echo ""
echo -e "  (The exact URL depends on the name you choose on Render)"
echo ""

echo -e "${YELLOW}${BOLD}Step 4: Login & configure${NC}"
echo ""
echo -e "  1. Open your Render URL"
echo -e "  2. Login: ${BOLD}admin@medai.com${NC} / ${BOLD}admin123${NC}"
echo -e "  3. Go to Settings → paste your OpenAI API key"
echo -e "  4. Share the URL with anyone — it works 24/7!"
echo ""

echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}    That's it! Your app will be always online.${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}Render Free Tier Notes:${NC}"
echo -e "  • App spins down after 15 min of inactivity"
echo -e "  • First visit after idle takes ~30 sec to wake up"
echo -e "  • Upgrade to Starter ($7/mo) for instant response"
echo ""
