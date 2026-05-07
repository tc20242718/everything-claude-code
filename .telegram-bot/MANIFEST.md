# Telegram NLP Bot — Deployment Manifest

**Created:** 2026-05-03  
**Version:** 1.1  
**Status:** Ready for deployment  
**Platform:** macOS arm64 (M4 Pro)

---

## 📦 Backup & Recovery

### Backup Location
```
/root/telegram-bot-backup-20260503-213023.tar.gz  (4.9 KB)
```

### Restore from backup
```bash
cd ~
tar -xzf telegram-bot-backup-20260503-213023.tar.gz
chmod 755 .telegram-bot/bot.py
```

---

## 🔗 Repository Source

**GitHub Repository:**
```
https://github.com/tc20242718/everything-claude-code
```

**Development Branch:**
```
claude/telegram-nlp-bot-deploy-voDva
```

**Commits:**
```
2b57be6 - docs(telegram): add comprehensive deployment guide
8211507 - feat(telegram): add standalone NLP bot with AES-256 token persistence
```

### Clone the branch
```bash
git clone -b claude/telegram-nlp-bot-deploy-voDva \
  https://github.com/tc20242718/everything-claude-code.git
cd everything-claude-code/.telegram-bot
```

---

## 📁 File Inventory

### In `.telegram-bot/` directory:

| File | Size | Purpose |
|------|------|---------|
| `bot.py` | 12.5 KB | Legacy: Telegram bot (now handled by OpenClaw natively) |
| `requirements.txt` | 184 B | Python 3 dependencies (upgraded 2026-05-07) |
| `UPGRADE-SESSION-SUMMARY.md` | — | Session log: dependency upgrade + recurring issues documented |
| `.env.example` | 876 B | Configuration template (fill with your values) |
| `com.macmini.telegram-bot.plist` | 1.2 KB | LaunchAgent auto-start config (deprecated; use OpenClaw) |
| `README.md` | 8.1 KB | Complete deployment guide (outdated; see UPGRADE-SESSION-SUMMARY.md) |
| `.gitignore` | 108 B | Exclude secrets from git |

### In root directory:
| File | Size | Purpose |
|------|------|---------|
| `macmini-audit.sh` | 5.8 KB | Pre-flight audit (Homebrew, Python, conflicts) |

---

## 🚀 Quick Start (3 Steps)

### 1. Pre-flight Check
```bash
bash ~/macmini-audit.sh
```

### 2. Follow the deployment guide
```bash
cat ~/.telegram-bot/README.md
# Follow Part 1-7 in the README
```

### 3. Start the bot
```bash
cd ~/.telegram-bot
source venv/bin/activate
python3 bot.py --setup     # First-time: encrypt your token
python3 bot.py             # Run the bot
```

---

## 📋 Deployment Checklist

- [ ] Run `macmini-audit.sh` to verify prerequisites
- [ ] Copy `.env.example` to `.env`
- [ ] Fill `.env` with: `TELEGRAM_BOT_TOKEN`, `ALLOWED_USER_IDS`, `TOKEN_ENCRYPT_PASSWORD`
- [ ] Create Python venv: `python3 -m venv venv`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Encrypt token: `python3 bot.py --setup`
- [ ] Test manually: `python3 bot.py` (send `/start` from iPhone)
- [ ] Edit `com.macmini.telegram-bot.plist` (replace `YOUR_USERNAME`)
- [ ] Install LaunchAgent: `cp com.macmini.telegram-bot.plist ~/Library/LaunchAgents/`
- [ ] Load service: `launchctl load ~/Library/LaunchAgents/com.macmini.telegram-bot.plist`
- [ ] Verify running: `launchctl list | grep telegram`

---

## 🔐 Security Checklist

- [ ] `.env` file permissions: `chmod 600 ~/.telegram-bot/.env`
- [ ] `TOKEN_ENCRYPT_PASSWORD` is strong (16+ chars)
- [ ] `.env` is in `.gitignore` (never commit secrets)
- [ ] `token.enc` is in `.gitignore` (never commit encrypted token)
- [ ] `ALLOWED_USER_IDS` contains only your Telegram user ID
- [ ] Never share `.env` or `token.enc`
- [ ] Never send PII through Telegram (use local channels)

---

## 📱 Bot Commands (From iPhone)

```
/start   — Initialize bot
/status  — OpenClaw + Ollama health check
/models  — List loaded Ollama models
/help    — Command reference

(any text) — Route through OpenClaw → LLM → response
```

---

## 🛠️ System Commands

```bash
# Setup (first-time encryption)
python3 bot.py --setup

# Run manually
cd ~/.telegram-bot
source venv/bin/activate
python3 bot.py

# Start auto-start service
launchctl load ~/Library/LaunchAgents/com.macmini.telegram-bot.plist

# Stop auto-start service
launchctl unload ~/Library/LaunchAgents/com.macmini.telegram-bot.plist

# Check if running
launchctl list | grep telegram

# View logs
tail -f ~/.telegram-bot/bot.log

# View errors
cat ~/.telegram-bot/bot-error.log

# Restart service (if running)
launchctl stop com.macmini.telegram-bot
launchctl start com.macmini.telegram-bot
```

---

## 🔧 Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Bot not responding | `launchctl list \| grep telegram` (check for PID) |
| "Unauthorized" on iPhone | Verify `ALLOWED_USER_IDS` in `.env` matches your Telegram user ID |
| Token decryption fails | Ensure `TOKEN_ENCRYPT_PASSWORD` in plist matches `.env` |
| OpenClaw unreachable | `curl http://localhost:8000/health` |
| Ollama unreachable | `curl http://localhost:11434/api/tags` |
| Bot crashes on start | Check `bot-error.log` for details |

---

## 📍 Important Paths

```
# Bot directory
~/.telegram-bot/

# Encrypted token (created after --setup)
~/.telegram-bot/token.enc

# LaunchAgent config (after installation)
~/Library/LaunchAgents/com.macmini.telegram-bot.plist

# Runtime logs
~/.telegram-bot/bot.log
~/.telegram-bot/bot-error.log

# Git repository
~/path/to/everything-claude-code/.telegram-bot/
```

---

## 🔄 Updates & Maintenance

### To pull latest updates from GitHub
```bash
cd ~/path/to/everything-claude-code
git pull origin claude/telegram-nlp-bot-deploy-voDva
cp .telegram-bot/* ~/.telegram-bot/
```

### To update Python dependencies
```bash
cd ~/.telegram-bot
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

### To reset the bot (keep encrypted token)
```bash
# Stop service first
launchctl unload ~/Library/LaunchAgents/com.macmini.telegram-bot.plist

# Remove venv and logs
rm -rf ~/.telegram-bot/venv ~/.telegram-bot/*.log

# Recreate venv and reinstall
python3 -m venv ~/.telegram-bot/venv
source ~/.telegram-bot/venv/bin/activate
pip install -r ~/.telegram-bot/requirements.txt

# Restart service
launchctl load ~/Library/LaunchAgents/com.macmini.telegram-bot.plist
```

---

## 📚 Documentation Files

1. **`README.md`** — Full step-by-step deployment guide (7 parts)
2. **`MANIFEST.md`** — This file (quick reference & recovery)
3. **`bot.py`** — Main bot implementation (source code)
4. **`.env.example`** — Configuration template with explanations

---

## 🎯 Next Steps

1. **Right now:** Read `.telegram-bot/README.md` for complete instructions
2. **First deployment:** Follow Part 1-7 in the README
3. **After setup:** Test from iPhone using `/start`, `/status`, etc.
4. **For auto-start:** Complete Part 6 (LaunchAgent configuration)
5. **Ongoing:** Monitor `bot.log` and update credentials as needed

---

## 📞 Support

If something goes wrong:

1. **Check prerequisites:** `bash ~/macmini-audit.sh`
2. **Read the README:** `cat ~/.telegram-bot/README.md`
3. **View error log:** `cat ~/.telegram-bot/bot-error.log`
4. **Check service:** `launchctl list | grep telegram`
5. **Test manually:** `cd ~/.telegram-bot && python3 bot.py`

---

**Backup created:** 2026-05-03 21:30 UTC  
**Version:** 1.1 (dependencies upgraded)  
**Ready for deployment:** ✅ Yes
