#!/bin/bash
# MacMini-AI-Coach Telegram Bot
# Pre-flight Audit Script
#
# Usage: bash macmini-audit.sh
#
# Checks for:
# - Homebrew installation and updates
# - Python 3.9+ and venv module
# - No conflicting Telegram bot installation
# - OpenClaw and Ollama availability (optional)

set -e

echo "=========================================="
echo "MacMini Telegram Bot — Pre-flight Audit"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter for issues found
ISSUES=0

# ── Homebrew ──────────────────────────────────────────────────────────────

echo -e "${BLUE}[Homebrew]${NC}"
if command -v brew &> /dev/null; then
    echo -e "${GREEN}✓${NC} Homebrew installed"
    BREW_VERSION=$(brew --version 2>/dev/null | head -n1)
    echo "  Version: $BREW_VERSION"
else
    echo -e "${RED}✗${NC} Homebrew not found"
    echo "  Install: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    ((ISSUES++))
fi
echo ""

# ── Python 3 ───────────────────────────────────────────────────────────────

echo -e "${BLUE}[Python 3]${NC}"
if command -v python3 &> /dev/null; then
    PY_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    echo -e "${GREEN}✓${NC} Python 3 installed: $PY_VERSION"

    # Check version >= 3.9
    MAJOR=$(echo $PY_VERSION | cut -d. -f1)
    MINOR=$(echo $PY_VERSION | cut -d. -f2)
    if [ "$MAJOR" -gt 3 ] || ([ "$MAJOR" -eq 3 ] && [ "$MINOR" -ge 9 ]); then
        echo -e "${GREEN}✓${NC} Python version 3.9+ (required for cryptography)"
    else
        echo -e "${RED}✗${NC} Python version < 3.9 (required 3.9+)"
        ((ISSUES++))
    fi
else
    echo -e "${RED}✗${NC} Python 3 not found"
    echo "  Install: brew install python@3.11"
    ((ISSUES++))
fi

# Check venv module
if python3 -c "import venv" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} venv module available"
else
    echo -e "${RED}✗${NC} venv module not available"
    echo "  On macOS: usually built-in. If missing, reinstall Python via Homebrew."
    ((ISSUES++))
fi
echo ""

# ── Telegram Bot Installation ──────────────────────────────────────────────

echo -e "${BLUE}[Telegram Bot]${NC}"
BOT_DIR="$HOME/.telegram-bot"
if [ -d "$BOT_DIR" ]; then
    echo -e "${YELLOW}[WARN]${NC}  Telegram bot directory exists: $BOT_DIR"

    if [ -f "$BOT_DIR/bot.py" ]; then
        echo "  - bot.py found"
    fi
    if [ -f "$BOT_DIR/.env" ]; then
        echo -e "${YELLOW}[WARN]${NC}  .env file exists (will need updating)"
    fi
    if [ -f "$BOT_DIR/token.enc" ]; then
        echo "  - Encrypted token already stored"
    fi
    if [ -d "$BOT_DIR/venv" ]; then
        echo "  - Virtual environment exists"
    fi
else
    echo -e "${GREEN}✓${NC} No existing telegram bot (clean install)"
fi
echo ""

# ── LaunchAgent ────────────────────────────────────────────────────────────

echo -e "${BLUE}[LaunchAgent]${NC}"
PLIST_PATH="$HOME/Library/LaunchAgents/com.macmini.telegram-bot.plist"
if [ -f "$PLIST_PATH" ]; then
    echo -e "${YELLOW}[WARN]${NC}  LaunchAgent plist already exists"
    if launchctl list | grep -q "com.macmini.telegram-bot"; then
        echo "  Service currently running (will need to unload first)"
    else
        echo "  Service is not currently running"
    fi
else
    echo -e "${GREEN}✓${NC} No existing LaunchAgent (clean install)"
fi
echo ""

# ── Ollama Process Check ───────────────────────────────────────────────────

echo -e "${BLUE}[Ollama Processes]${NC}"
OLLAMA_PROCS=$(ps aux | grep -c '[o]llama' || true)
if [ "$OLLAMA_PROCS" -gt 1 ]; then
    echo -e "${RED}✗${NC} Multiple Ollama processes detected ($OLLAMA_PROCS). This degrades performance."
    echo "  Fix: pkill -f ollama && ollama serve &"
    ((ISSUES++))
elif [ "$OLLAMA_PROCS" -eq 1 ]; then
    echo -e "${GREEN}✓${NC} Ollama: single process running"
else
    echo -e "${YELLOW}[WARN]${NC}  Ollama not running"
fi
echo ""

# ── OpenClaw & Ollama (Optional) ───────────────────────────────────────────

echo -e "${BLUE}[Optional: Service Endpoints]${NC}"

# Check OpenClaw gateway (native port 18789, not 8000)
if command -v openclaw &> /dev/null; then
    OPENCLAW_STATUS=$(openclaw health 2>/dev/null | grep -E "telegram:|Agents:" | head -2 || true)
    if [ -n "$OPENCLAW_STATUS" ]; then
        echo -e "${GREEN}✓${NC} OpenClaw gateway running on localhost:18789"
        if echo "$OPENCLAW_STATUS" | grep -q "failed (401)"; then
            echo -e "${RED}✗${NC} Telegram channel: 401 Unauthorized — re-run: openclaw configure"
            ((ISSUES++))
        else
            echo -e "${GREEN}✓${NC} Telegram channel: connected"
        fi

        # Check dmPolicy — pairing blocks plain text messages
        DM_POLICY=$(openclaw config get channels.telegram.dmPolicy 2>/dev/null | tail -1 | tr -d '"' || true)
        if [ "$DM_POLICY" = "pairing" ]; then
            echo -e "${RED}✗${NC} dmPolicy=pairing: plain text messages will be ignored"
            echo "  Fix: openclaw config set channels.telegram.dmPolicy allowlist && openclaw gateway --force"
            ((ISSUES++))
        elif [ -n "$DM_POLICY" ]; then
            echo -e "${GREEN}✓${NC} dmPolicy: $DM_POLICY"
        fi
    else
        echo -e "${YELLOW}[WARN]${NC}  OpenClaw gateway not responding — start with: openclaw gateway --force"
    fi
else
    echo -e "${YELLOW}[WARN]${NC}  openclaw CLI not found"
fi

if command -v curl &> /dev/null; then
    # Check Ollama
    if curl -s -m 2 http://localhost:11434/api/tags &> /dev/null; then
        echo -e "${GREEN}✓${NC} Ollama responding on localhost:11434"
        MODELS=$(curl -s http://localhost:11434/api/tags 2>/dev/null | grep -o '"name":"[^"]*' | cut -d'"' -f4 | wc -l)
        echo "  Models loaded: $MODELS"
    else
        echo -e "${YELLOW}[WARN]${NC}  Ollama not responding (will be checked when bot starts)"
    fi
else
    echo -e "${YELLOW}[WARN]${NC}  curl not found (skipping endpoint checks)"
fi
echo ""

# ── Summary ────────────────────────────────────────────────────────────────

echo "=========================================="
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed — ready to proceed${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Copy requirements and scripts to ~/.telegram-bot/"
    echo "2. cd ~/.telegram-bot"
    echo "3. python3 -m venv venv"
    echo "4. source venv/bin/activate"
    echo "5. pip install -r requirements.txt"
    echo "6. python3 bot.py --setup  (encrypt your token)"
    echo "7. python3 bot.py           (test manually)"
    echo "8. Ctrl+C to stop"
    echo "9. See deployment guide for LaunchAgent setup"
else
    echo -e "${RED}✗ $ISSUES issue(s) found — please resolve before proceeding${NC}"
fi
echo ""
