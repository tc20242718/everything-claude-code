# OpenClaw + Telegram Operations

## When to Use

Use this skill when troubleshooting or operating the OpenClaw → Telegram → Ollama stack on macOS (Mac Mini / Apple Silicon). Covers gateway startup, channel auth, model selection, and recurring failure patterns.

## How It Works

### Architecture

```
iPhone → Telegram → OpenClaw gateway (:18789) → Ollama (:11434) → reply
```

- OpenClaw manages the Telegram bot connection natively via `openclaw channels`
- `bot.py` is a legacy fallback — not needed when OpenClaw handles Telegram directly
- One Telegram bot token can only connect to **one** process at a time

### Key Commands

```bash
openclaw health                          # Check gateway + channel status
openclaw gateway --force                 # Kill + restart gateway
openclaw config get channels.telegram    # Inspect Telegram channel config
openclaw config set channels.telegram.botToken <token>  # Update token directly
openclaw config set agents.defaults.model.primary ollama/qwen3:14b
openclaw config set agents.main.profile default
openclaw config set channels.telegram.dmPolicy allowlist  # Allow plain text from allowFrom list
openclaw logs                            # Tail live gateway logs
```

## Known Recurring Issues

### 1. Multiple Ollama Processes (performance degradation)

**Symptom:** Slow responses, high load averages, `ps aux | grep ollama` shows 3+ processes

**Cause:** Ollama was started multiple times (manually + LaunchAgent + OpenClaw restart)

**Fix:**
```bash
pkill -f ollama
# wait 5 seconds
ollama serve &
```

**Prevention:** Added check to `macmini-audit.sh`

---

### 2. Telegram 401 Unauthorized

**Symptom:** `openclaw health` shows `telegram: failed (401)`

**Cause:** Bot token in OpenClaw config is wrong, expired, or was overwritten

**Fix:**
```bash
openclaw config set channels.telegram.botToken <token-from-BotFather>
openclaw gateway --force
```

Note: The configure wizard has a known `TypeError: Cannot read properties of undefined (reading 'trim')` bug — bypass it with `config set` directly.

---

### 3. Gateway Mode Stuck on Remote

**Symptom:** `openclaw doctor` shows `Gateway start blocked: set gateway.mode=local`

**Cause:** `openclaw configure` wizard set `gateway.mode=remote` if "Remote" was selected accidentally

**Fix:**
```bash
openclaw config set gateway.mode local
openclaw gateway --force
```

---

### 4. Wrong Model / kimi/k2p5 FailoverError

**Symptom:** Logs show `FailoverError: Unknown model: kimi/k2p5`, messages hang with no reply

**Cause:** Stale session referencing a model that no longer exists

**Fix:**
```bash
openclaw config set agents.defaults.model.primary ollama/qwen3:14b
openclaw gateway --force
```

---

### 5. Messages Pending / No Reply Delivered

**Symptom:** Telegram shows message as pending; `openclaw health` shows gateway running

**Diagnosis steps:**
```bash
openclaw logs   # watch in real time while sending from iPhone
```

Common causes in order:
1. Gateway mode was `remote` — fix with `config set gateway.mode local`
2. Wrong model configured — fix with `config set agents.defaults.model.primary`
3. Multiple Ollama processes — fix with `pkill -f ollama && ollama serve &`

---

### 6. Bot Responds to /commands but Not Plain Text

**Symptom:** Slash commands like `/help` work; plain text messages are silently ignored

**Cause:** `channels.telegram.dmPolicy` is set to `pairing` — requires a pairing handshake before plain text is accepted

**Fix:**
```bash
openclaw config set channels.telegram.dmPolicy allowlist
openclaw gateway --force
```

**Why allowlist works:** The `allowFrom` list already contains your Telegram user ID. Switching to `allowlist` mode lets OpenClaw accept plain text from any ID in that list without requiring pairing.

---

## Model Reference (Mac Mini M4 Pro)

| Model | Size | Speed | Best for |
|---|---|---|---|
| `ollama/llama3.1:8b` | 4.9 GB | Fast | Quick replies |
| `ollama/qwen3:14b` | 9.3 GB | Medium | General use (recommended) |
| `ollama/qwen3-coder:30b` | 18 GB | Slow | Code tasks |

## Health Check Runbook

```bash
# 1. Check overall status
openclaw health

# 2. Check Ollama process count (must be exactly 1)
ps aux | grep ollama | grep -v grep | wc -l

# 3. Check gateway port
lsof -i :18789

# 4. Check logs for errors
openclaw logs | grep -E "error|warn|401|failed"

# 5. Full pre-flight
bash ~/path/to/everything-claude-code/macmini-audit.sh
```
