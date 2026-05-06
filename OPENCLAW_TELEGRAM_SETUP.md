# OpenClaw + Telegram Setup Guide

**Last Updated:** May 2026  
**Environment:** Mac Mini M4 Pro (24GB RAM), macOS, Terminus terminal  
**Status:** ✅ Fully configured and tested

---

## Quick Start

### Current Configuration
- **OpenClaw:** 2026.4.14 (local gateway on port 18789)
- **Telegram Bot:** @opc_theo_bot (connected natively)
- **LLM:** Ollama + qwen3:14b (local, M4 GPU-accelerated)
- **Response Time:** ~10-15 seconds per reply
- **Auto-start:** LaunchAgent (runs on boot)

### Essential Commands (Terminus)

```bash
# Check model (current setting)
openclaw config get agents.defaults.model.primary

# Switch to faster model (llama3.1:8b, 4-5s responses)
openclaw config set agents.defaults.model.primary ollama/llama3.1:8b && openclaw gateway --force

# Switch to advanced model (qwen3:14b, 10-15s responses, better quality)
openclaw config set agents.defaults.model.primary ollama/qwen3:14b && openclaw gateway --force

# Set Telegram profile (for natural language)
openclaw config set tools.profile messaging && openclaw gateway --force

# Test Ollama is running
curl http://localhost:11434/api/tags

# Restart gateway
openclaw gateway --force
```

**Note:** All commands are single-line, no backslash continuation. Use new Terminus tabs for parallel testing.

---

## Known Issues & Fixes

### Issue: Telegram replies taking 60+ seconds
**Cause:** Multiple Ollama processes running (Homebrew, /usr/local, Ollama.app)  
**Fix:** Kill all and restart one instance
```bash
killall ollama
sleep 2
/Applications/Ollama.app/Contents/Resources/ollama serve &
sleep 3
```
**Verify:** `ps aux | grep ollama` should show 2 lines only (1 process + grep)

### Issue: Model switch not taking effect
**Cause:** Gateway not restarted after config change  
**Fix:** Use `&&` to chain config + restart:
```bash
openclaw config set agents.defaults.model.primary ollama/qwen3:14b && openclaw gateway --force
```

### Issue: Slow responses even on fast models
**Cause:** GPU not enabled (running CPU-only)  
**Fix:** Check if Metal GPU is available:
```bash
ps aux | grep ollama
```
Should show Ollama process. If responses are slow, GPU may not be detected.

---

## Model Trade-offs

| Model | Quality | Speed | Best For |
|-------|---------|-------|----------|
| llama3.1:8b | Medium | 4-5s | Speed-critical, acceptable quality |
| qwen3:14b | High | 10-15s | Natural language conversation (recommended) |
| qwen3-coder:30b | Highest | 30-60s+ | Complex reasoning only |

---

## Privacy & Security

### Redaction Command (for sharing diagnostics safely)
```bash
cat ~/.openclaw/openclaw.json | sed 's/"botToken":[ ]*"[^"]*"/"botToken": "[REDACTED]"/g' | sed 's/"token":[ ]*"[^"]*"/"token": "[REDACTED]"/g' | sed 's/"apiKey":[ ]*"[^"]*"/"apiKey": "[REDACTED]"/g' | sed 's/"baseUrl":[ ]*"[^"]*"/"baseUrl": "[REDACTED]"/g' | sed 's/"url":[ ]*"[^"]*"/"url": "[REDACTED]"/g' | sed 's/"spec":[ ]*"[^"]*"/"spec": "[REDACTED]"/g' | sed 's/"installPath":[ ]*"[^"]*"/"installPath": "[REDACTED]"/g' | sed 's|/Users/[^/]*/|/Users/[REDACTED]/|g' | sed 's/"allowFrom":[ ]*\[[^]]*\]/"allowFrom": "[REDACTED]"/g'
```

### Security Checklist
- [ ] Telegram bot token rotated after setup
- [ ] OpenClaw gateway auth token secured
- [ ] No credentials in git history
- [ ] bot.py (~/.telegram-bot/bot.py) deleted (deprecated)
- [ ] Only one Ollama process running

---

## Configuration Schema

### agents.defaults
```json
{
  "model": {
    "primary": "ollama/qwen3:14b"
  },
  "workspace": "/Users/[username]/.openclaw/workspace",
  "maxConcurrent": 4,
  "subagents": {
    "maxConcurrent": 8
  }
}
```

**Note:** There is NO `generation` key. Generation settings (temperature, top_p, max_tokens) are not configurable via CLI in this version.

### Valid Config Paths
- ✅ `agents.defaults.model.primary` — change LLM model
- ✅ `tools.profile` — change interaction profile (messaging, coding, etc.)
- ❌ `agents.main.profile` — does not exist (main is a binding agentId, not a config key)
- ❌ `agents.defaults.generation.*` — generation key does not exist

---

## Diagnostics & Troubleshooting

### Test Ollama directly (in new Terminus tab)
```bash
time curl http://localhost:11434/api/generate -X POST -H 'Content-Type: application/json' -d '{"model":"llama3.1:8b","prompt":"Say hello in one sentence","stream":false}'
```

Expected output: JSON response + `real 4.7s` (or similar)

### Check gateway status
```bash
ps aux | grep openclaw
```

### Check logs
```bash
tail -50 ~/.openclaw/logs/gateway.log
```

### Verify only ONE Ollama instance
```bash
ps aux | grep ollama
```
Should show exactly 2 lines: 1 ollama process + 1 grep line

---

## Session Audit Log

Errors encountered and fixed during setup:

| ID | Error | Fix |
|----|-------|-----|
| E001 | Redaction command failed (no space before colon in sed) | Use `[ ]*` in sed patterns |
| E002 | Invalid config path `agents.main.profile` | Verified actual schema first |
| E003 | Unsolicited config changes | Only suggest when explicitly asked |
| E004 | Multi-line bash with backslash failed in Terminus/zsh | Use single-line commands only |
| E005 | Ran Mac commands from Linux environment | Clarify which environment each command runs in |
| E006 | Suggested non-existent generation config | Verified schema before suggesting paths |
| E007 | Multiple Ollama processes caused 60s+ slowness | Kill duplicates, keep one instance |
| E008 | Assumed need to exit foreground process | Use new Terminus tabs instead |

---

## Next Steps

1. **Rotate credentials** (if token was exposed)
   - Telegram bot: Message @BotFather to get new token
   - OpenClaw: Regenerate gateway tokens in config

2. **Verify performance**
   - Send test message to @opc_theo_bot
   - Confirm response quality and speed match expectations

3. **Clean up**
   - Delete `~/.telegram-bot/bot.py` (deprecated)
   - Verify only one Ollama process running

4. **Optional: Performance tuning**
   - Try different models to find speed/quality balance
   - Monitor response times with `time curl ...`

---

## References

- **Skill Location:** `skills/openclaw-telegram/SKILL.md`
- **Session:** [Claude Code Session Link](https://claude.ai/code/session_016hiRppfoRbddR9SYeLjUZX)
- **PR:** [GitHub PR #1](https://github.com/tc20242718/everything-claude-code/pull/1)
