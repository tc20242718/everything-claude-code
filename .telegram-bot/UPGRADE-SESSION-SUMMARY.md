# Telegram + OpenClaw Upgrade Session Summary

**Date:** 2026-05-07  
**Branch:** `claude/upgrade-telegram-cBTet`  
**Status:** Dependencies upgraded, OpenClaw integrated, recurring issues documented

---

## What Was Accomplished

### 1. Dependency Upgrade (Initial Task)
Updated `.telegram-bot/requirements.txt` to latest versions:
- `python-telegram-bot` 21.6 → 22.7
- `httpx` 0.27.0 → 0.28.1
- `cryptography` 42.0.8 → 47.0.0
- `python-dotenv` 1.0.1 → 1.2.2

**Result:** All PTB 22.7 APIs are backward compatible. No code changes to `bot.py` required.

### 2. Architecture Change: OpenClaw Native Integration
Discovered OpenClaw has **native Telegram support** built-in (`openclaw channels`). This is better than routing through `bot.py`:

**Old approach:** iPhone → Telegram → bot.py → OpenClaw → Ollama  
**New approach:** iPhone → Telegram → OpenClaw (natively) → Ollama

**Benefits:**
- One less process to maintain (`bot.py` no longer needed)
- OpenClaw handles session persistence, fallbacks, routing natively
- Simpler architecture

### 3. Resolved Configuration Issues

| Issue | Solution |
|---|---|
| OpenClaw bot token failing (401) | Updated token via `openclaw config set channels.telegram.botToken` |
| Gateway mode stuck on `remote` | Fixed with `openclaw config set gateway.mode local` |
| Gateway not responding | Discovered correct port is 18789, not 8000 |
| Messages pending / no reply | Root cause: `dmPolicy=pairing` blocking plain text |
| Slow responses | Multiple Ollama processes (3) competing — consolidated to 1 |

### 4. Documentation Created

**Updated `macmini-audit.sh`:**
- Added Ollama process count check (warns if >1)
- Fixed OpenClaw health check to use port 18789 and CLI
- Added Telegram 401 detection
- Added dmPolicy check (flags if set to `pairing`)

**Created `skills/openclaw-telegram-ops/SKILL.md`:**
- 6 recurring failure patterns documented (Ollama processes, 401, gateway mode, kimi failover, pending messages, dmPolicy pairing)
- Each with symptom, cause, and exact fix
- Model reference table for Mac Mini M4 Pro
- Health check runbook

---

## Current State (End of Session)

**What's Working:**
- ✅ OpenClaw gateway running on localhost:18789
- ✅ Ollama running on localhost:11434 (1 process)
- ✅ Telegram bot connected natively
- ✅ Slash commands work (`/help`, etc.)
- ✅ Models configured: qwen3:14b (default), llama3.1:8b, qwen3-coder:30b

**What's Still Being Tested:**
- ⏳ Plain text natural language responses (requires dmPolicy=allowlist to be set and gateway restarted)

---

## Key Findings

### The dmPolicy Issue (Issue #6)
OpenClaw's Telegram channel has a `dmPolicy` setting that controls how it handles incoming messages:
- `dmPolicy=pairing` — requires a handshake; silently ignores plain text from unpaired users
- `dmPolicy=allowlist` — allows plain text from any ID in the `allowFrom` list (your ID is already there)

**Current config:** pairing (blocking natural language)  
**Fix:** 
```bash
openclaw config set channels.telegram.dmPolicy allowlist
openclaw gateway --force
```

### Why Multiple Ollama Processes Happened
Ollama was started from multiple sources simultaneously:
1. Manual `ollama serve &` 
2. OpenClaw's internal Ollama integration
3. Restart cascades during testing

**Prevention:** Always kill before restarting:
```bash
pkill -f ollama
sleep 2
ollama serve &
```

### Gateway Port Confusion
OpenClaw's gateway runs on **18789** by default, not 8000. The old `bot.py` was configured to post to localhost:8000, which didn't exist. The real gateway is WebSocket on :18789 — OpenClaw handles the Telegram bridge internally.

---

## Files Changed This Session

| File | Change | Commit |
|---|---|---|
| `.telegram-bot/requirements.txt` | Upgrade 4 packages | `a4ecabd` |
| `.telegram-bot/MANIFEST.md` | Version bump 1.0→1.1 | `a4ecabd` |
| `.telegram-bot/README.md` | Version bump v1.0→v1.1 | `a4ecabd` |
| `macmini-audit.sh` | Add Ollama & dmPolicy checks | `dba4cf3` & `881eede` |
| `skills/openclaw-telegram-ops/SKILL.md` | Created with 6 issues + runbook | `dba4cf3` & `881eede` |

---

## Next Steps

1. **Immediate:** Run fix for dmPolicy (if not done):
   ```bash
   openclaw config set channels.telegram.dmPolicy allowlist
   openclaw gateway --force
   ```

2. **Test:** Send plain text from iPhone — should get natural language response from qwen3:14b

3. **Validate:** Run audit script to catch any regressions:
   ```bash
   bash ~/path/to/everything-claude-code/macmini-audit.sh
   ```

4. **Optional:** If `bot.py` is no longer needed, you can remove it:
   ```bash
   rm ~/.telegram-bot/bot.py
   launchctl unload ~/Library/LaunchAgents/com.macmini.telegram-bot.plist
   ```

---

## Commits Pushed

```
a4ecabd - chore(telegram): upgrade dependencies to latest versions
dba4cf3 - feat(telegram): add ops skill and audit checks for recurring issues
881eede - docs(telegram): document dmPolicy pairing issue blocking plain text
```

All on branch `claude/upgrade-telegram-cBTet`.
