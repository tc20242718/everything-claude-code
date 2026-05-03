# MacMini-AI-Coach Telegram Bot

A Telegram bot that routes natural language messages through OpenClaw → LLM stack → back to your iPhone.

**Key Features:**
- 🔐 AES-256-CBC encrypted token persistence (no manual reconnection)
- 🤖 OpenClaw primary routing with Ollama fallback
- 🛡️ Hard-blocks PII and sensitive financial data
- 🚀 Auto-starts on Mac Mini boot via LaunchAgent
- 📱 Full control from iPhone Telegram app
- 🎯 User ID whitelist (only you can access)

## What It Does

```
iPhone → Telegram → Bot (Mac Mini) → OpenClaw :8000 → LLM → response
                                          ↓ (if down)
                                     Ollama :11434
```

## Prerequisites

- Mac Mini (arm64/M4 Pro) with macOS
- Telegram bot token from [@BotFather](https://t.me/BotFather)
- Your Telegram user ID from [@userinfobot](https://t.me/userinfobot)
- OpenClaw and/or Ollama running locally
- Python 3.9+ with venv

## Part 1: Pre-flight Audit

Before installing anything, verify prerequisites:

```bash
bash ../macmini-audit.sh
```

Expected output:
```
✓ Homebrew installed
✓ Python 3.9+ available
✓ venv module available
✓ No existing telegram bot (clean install)
✓ All checks passed — ready to proceed
```

If any checks fail, resolve before continuing.

## Part 2: Setup Environment

```bash
# Navigate to bot directory
cd ~/.telegram-bot

# Create isolated Python virtual environment (arm64 native)
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Verify installation
python3 -c "import telegram; import httpx; import cryptography; print('✓ All packages OK')"
```

## Part 3: Configure .env

Copy the template and fill in your values:

```bash
cp .env.example .env
chmod 600 .env
```

Edit `.env` and fill in:

```
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TOKEN_ENCRYPT_PASSWORD=your-strong-password-here
ALLOWED_USER_IDS=987654321
OPENCLAW_URL=http://localhost:8000
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:14b
```

**Required Values:**
- `TELEGRAM_BOT_TOKEN` — Get from [@BotFather](https://t.me/BotFather) `/newbot`
- `ALLOWED_USER_IDS` — Your Telegram user ID (get from [@userinfobot](https://t.me/userinfobot))
- `TOKEN_ENCRYPT_PASSWORD` — Strong password to encrypt your token (you choose)

## Part 4: Encrypt Bot Token

First-time setup: encrypt your bot token for secure persistent storage.

```bash
source venv/bin/activate
python3 bot.py --setup
```

Follow prompts:
1. Paste your Telegram bot token
2. Enter the same `TOKEN_ENCRYPT_PASSWORD` from `.env`

Expected output:
```
Token encrypted and stored to /Users/yourname/.telegram-bot/token.enc
Set TOKEN_ENCRYPT_PASSWORD in your .env before starting the bot.
```

Verify encrypted token file:

```bash
ls -la token.enc  # Should be ~50 bytes
```

## Part 5: Test Manually

Before auto-start, test the bot locally:

```bash
source venv/bin/activate
export $(cat .env | grep -v '#' | xargs)
python3 bot.py
```

Expected startup:
```
[INFO] macmini-bot: Bot starting — polling for messages
```

**From iPhone Telegram:**
1. Search for your bot by username (e.g., `@macmini_coach_bot`)
2. Send `/start` → bot replies with welcome message ✅
3. Send `/status` → bot shows OpenClaw + Ollama health ✅
4. Send `/models` → bot lists loaded Ollama models ✅
5. Send any natural language message → bot routes through OpenClaw → response ✅

**Stop the bot:**
```
Ctrl + C
```

## Part 6: Configure Auto-Start (LaunchAgent)

This makes the bot start automatically on Mac Mini boot.

### Step 1: Replace placeholders

Edit `com.macmini.telegram-bot.plist` and replace:
- `YOUR_USERNAME` → your actual macOS username (run `whoami` to find it)
- `YOUR_ENCRYPTION_PASSWORD_HERE` → your `TOKEN_ENCRYPT_PASSWORD` from `.env`
- `YOUR_TELEGRAM_USER_ID_HERE` → your Telegram user ID

### Step 2: Install LaunchAgent

```bash
cp com.macmini.telegram-bot.plist ~/Library/LaunchAgents/
chmod 644 ~/Library/LaunchAgents/com.macmini.telegram-bot.plist
```

### Step 3: Load the service

```bash
launchctl load ~/Library/LaunchAgents/com.macmini.telegram-bot.plist
```

### Step 4: Verify it started

```bash
launchctl list | grep telegram
# Should show: "com.macmini.telegram-bot    12345    0" (with a PID)
```

### Step 5: Check logs

```bash
tail -f bot.log
# Should show: "Bot starting — polling for messages"
```

## Part 7: Final Verification

From your iPhone, send these commands and verify responses:

| Message | Expected |
|---------|----------|
| `/start` | Welcome message with command list |
| `/status` | ✅ OpenClaw online, ✅ Ollama with N models |
| `/models` | List of installed Ollama models with sizes |
| `/help` | Command reference and security reminder |
| `what is my system status` | Natural language routed to OpenClaw → response |
| `list my loaded models` | Natural language → Ollama list response |

## Security Rules (Read These)

⚠️ **Never send through Telegram:**
- Client names or account numbers
- Portfolio positions or trade details
- Social security numbers or passport info
- Credit card numbers or PII
- Any sensitive financial data

**Why?** Telegram messages transit third-party servers. The bot hard-blocks these phrases, but don't test it.

## Commands Reference

### User Commands (From iPhone)

```
/start   — Initialize bot session
/status  — OpenClaw + Ollama health check
/models  — List installed Ollama models
/help    — Command reference
(any text) — Natural language → OpenClaw → response
```

### System Commands (Terminal)

```bash
# Setup (first-time)
python3 bot.py --setup

# Run manually (testing)
python3 bot.py

# Start auto-start service
launchctl load ~/Library/LaunchAgents/com.macmini.telegram-bot.plist

# Stop auto-start service
launchctl unload ~/Library/LaunchAgents/com.macmini.telegram-bot.plist

# Check service status
launchctl list | grep telegram

# View live logs
tail -f bot.log

# View error log
cat bot-error.log
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Bot not responding | Run `launchctl list \| grep telegram` — is PID showing? |
| "Unauthorized" error | Check `ALLOWED_USER_IDS` in `.env` — must be your Telegram user ID |
| OpenClaw unreachable | Run `curl localhost:8000/health` — is OpenClaw running? |
| Token decryption error | Verify `TOKEN_ENCRYPT_PASSWORD` in plist matches `.env` |
| Bot starts then crashes | Check `bot-error.log` for details |

## Complete Rollback

If you need to remove the bot entirely:

```bash
# Stop service
launchctl unload ~/Library/LaunchAgents/com.macmini.telegram-bot.plist

# Remove LaunchAgent
rm ~/Library/LaunchAgents/com.macmini.telegram-bot.plist

# Remove files (keeps encrypted token as backup)
rm -rf ~/.telegram-bot/venv
rm ~/.telegram-bot/bot.py

# Full wipe (including encrypted token)
rm -rf ~/.telegram-bot
```

## Architecture

**Files:**
- `bot.py` — Main bot implementation (async, polling)
- `requirements.txt` — Python dependencies (arm64-compatible)
- `.env.example` — Configuration template
- `com.macmini.telegram-bot.plist` — LaunchAgent auto-start config
- `.env` — Your actual config (git-ignored, secrets)
- `token.enc` — Your encrypted token (git-ignored, secrets)
- `bot.log` — Runtime logs
- `bot-error.log` — Error logs

**Dependencies:**
- `python-telegram-bot` — Telegram bot API
- `httpx` — Async HTTP client for OpenClaw/Ollama
- `cryptography` — AES-256-CBC encryption
- `python-dotenv` — Environment variable loading

**Security:**
- Token encrypted at rest (AES-256-CBC with PBKDF2 key derivation)
- User ID whitelist (only you can access)
- PII blocklist (hard-blocks sensitive phrases)
- No secrets in git (`.env`, `token.enc` git-ignored)
- 300s timeout for long model loads

## Support

If something goes wrong:
1. Check `bot-error.log` for error messages
2. Verify OpenClaw/Ollama are running locally
3. Confirm `ALLOWED_USER_IDS` is your correct Telegram user ID
4. Run `macmini-audit.sh` to check prerequisites
5. Test manually: `python3 bot.py` and send `/status`

---

**Version:** v1.0  
**Platform:** macOS (arm64/M4 Pro)  
**Last Updated:** 2026-05-03
