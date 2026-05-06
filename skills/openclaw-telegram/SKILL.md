---
name: openclaw-telegram
description: Use this skill when working on OpenClaw + Telegram + Ollama setup on macOS. Covers config management, privacy-safe diagnostics, performance tuning, and shell compatibility for Terminus/zsh. Enforces minimum-data-sharing and privacy-first protocols at all times.
origin: ECC
---

# OpenClaw + Telegram Skill

## When to Activate

- Configuring OpenClaw gateway, agents, or channels
- Debugging Telegram bot connectivity or response issues
- Tuning model performance (Ollama, qwen3, llama3.1)
- Running diagnostics that require reading config files
- Any task requiring the user to share system output

---

## Environment Facts

| Item | Value |
|------|-------|
| OpenClaw version | 2026.4.14 |
| Mac platform | macOS (Mac Mini M4 Pro) |
| Terminal app | **Terminus** — use single-line commands only |
| Shell | zsh — backslash `\` line continuation does NOT work |
| Gateway port | 18789 |
| Ollama port | 11434 |
| Models available | qwen3:14b, llama3.1:8b, qwen3-coder:30b |
| Telegram bot | @opc_theo_bot (connected natively via OpenClaw) |
| Gateway mode | local (LaunchAgent, auto-starts on boot) |
| Deprecated | bot.py — OpenClaw handles Telegram directly |

---

## Privacy Protocol — NON-NEGOTIABLE

### Principle of Least Privilege
Before asking the user to share ANY output:
1. Ask yourself: **what is the minimum I need to answer this question?**
2. Ask only for structure/keys, not values
3. Never ask for tokens, credentials, paths, user IDs, or IP addresses
4. If an error message is enough, don't ask for the full config

### Minimum-Data Approach for Config Questions
Instead of asking for the full config, ask targeted questions:

```
# Ask: does this key exist?
openclaw config get agents.defaults

# Ask: what profile values are valid?
# (already known: "minimal", "coding", "messaging", "full")

# Ask: what is the current model?
openclaw config get agents.defaults.model.primary
```

### When Full Config Is Truly Needed
Use the **verified redaction command** (single line, Terminus-compatible):

```bash
cat ~/.openclaw/openclaw.json | sed 's/"botToken":[ ]*"[^"]*"/"botToken": "[REDACTED]"/g' | sed 's/"token":[ ]*"[^"]*"/"token": "[REDACTED]"/g' | sed 's/"apiKey":[ ]*"[^"]*"/"apiKey": "[REDACTED]"/g' | sed 's/"baseUrl":[ ]*"[^"]*"/"baseUrl": "[REDACTED]"/g' | sed 's/"url":[ ]*"[^"]*"/"url": "[REDACTED]"/g' | sed 's/"spec":[ ]*"[^"]*"/"spec": "[REDACTED]"/g' | sed 's/"installPath":[ ]*"[^"]*"/"installPath": "[REDACTED]"/g' | sed 's|/Users/[^/]*/|/Users/[REDACTED]/|g' | sed 's/"allowFrom":[ ]*\[[^]]*\]/"allowFrom": "[REDACTED]"/g'
```

**What this redacts:**
- botToken, token, apiKey (all credential fields)
- baseUrl, url (all endpoint URLs)
- installPath, spec (all file/package paths)
- /Users/[username]/ (all user home directory references)
- allowFrom arrays (Telegram user IDs)

**QA status:** Verified working against mock config matching real structure.

---

## Known Config Structure

```json
{
  "agents": {
    "defaults": {
      "model": { "primary": "ollama/qwen3:14b" },
      "workspace": "[path]"
    }
  },
  "bindings": [
    { "agentId": "main", "match": { "channel": "telegram" }, "type": "route" }
  ],
  "channels": {
    "telegram": { "allowFrom": ["[id]"], "botToken": "[token]", "enabled": true }
  },
  "gateway": {
    "auth": { "token": "[token]" },
    "bind": "loopback",
    "mode": "local",
    "port": 18789
  },
  "tools": {
    "profile": "coding"
  }
}
```

### Valid Config Key Paths

| Goal | Correct Command |
|------|----------------|
| Set model | `openclaw config set agents.defaults.model.primary ollama/qwen3:14b` |
| Set profile | `openclaw config set tools.profile messaging` |
| Set temperature | `openclaw config set agents.defaults.generation.temperature 0.7` |
| Set max tokens | `openclaw config set agents.defaults.generation.max_tokens 256` |
| Restart gateway | `openclaw gateway --force` |

**INVALID paths (do not use):**
- `agents.main.profile` — "main" is a binding agentId, not a config key
- `tools.profile default` — "default" is not a valid profile value

**Valid `tools.profile` values:** `minimal`, `coding`, `messaging`, `full`

---

## Performance Tuning

### Priority: Natural Language First, Then Speed

For the best natural language quality with acceptable speed on M4 Pro:

**Recommended model:** `ollama/qwen3:14b` (best balance for conversational replies)

**Generation tuning for natural responses:**
```bash
openclaw config set agents.defaults.model.primary ollama/qwen3:14b
openclaw config set tools.profile messaging
openclaw config set agents.defaults.generation.temperature 0.7
openclaw config set agents.defaults.generation.top_p 0.9
openclaw config set agents.defaults.generation.max_tokens 256
openclaw gateway --force
```

**Model trade-offs:**

| Model | Quality | Speed | Best For |
|-------|---------|-------|----------|
| qwen3:14b | High | Medium | Natural conversation (recommended) |
| llama3.1:8b | Medium | Fast | Speed-critical replies |
| qwen3-coder:30b | Highest | Slow | Complex reasoning only |

### Warm-Up (Eliminate Cold Start Delay)
First request after gateway restart is slow — model loads from disk. To pre-warm:
```bash
curl http://localhost:11434/api/generate -X POST -H "Content-Type: application/json" -d '{"model":"qwen3:14b","prompt":"hi","stream":false}'
```

---

## Diagnostics

Run these on the Mac in Terminus to diagnose issues. All single-line, no backslashes.

```bash
# Is the gateway running?
ps aux | grep openclaw

# Is Ollama running and which models are loaded?
curl http://localhost:11434/api/tags

# Check OpenClaw logs for errors
tail -50 ~/.openclaw/logs/gateway.log

# Verify current model setting (safe to share — no credentials)
openclaw config get agents.defaults.model
```

---

## Audit Log — Errors & Lessons

### ERROR-001: Broken redaction command exposed credentials
**What happened:** Provided `sed 's/"token":"[^"]*"'` patterns but JSON was pretty-printed with spaces (`"token": "value"`), so no fields were redacted. User shared botToken, gateway auth token, remote token, and Telegram user ID.  
**Fix:** Always use `[ ]*` between colon and quote: `'s/"token":[ ]*"[^"]*"'`  
**Rule:** QA test all redaction commands against a mock payload before providing them.

### ERROR-002: Suggested invalid config key paths
**What happened:** Told user to run `openclaw config set agents.main.profile default`. Neither `agents.main` nor `default` exist in the schema. Error: `Unrecognized key: "main"`.  
**Fix:** Check actual config structure before suggesting key paths.  
**Rule:** Never suggest a config path without verifying it exists in the schema first.

### ERROR-003: Unsolicited config changes violated user role
**What happened:** User asked "how can I improve performance" — responded by proactively suggesting config modifications without being asked to make changes.  
**Fix:** Answer the question asked. Don't reach into someone's config without being explicitly asked.  
**Rule:** Information ≠ permission to act. Ask before suggesting changes to user's system.

### ERROR-004: Multi-line bash commands failed in Terminus
**What happened:** Provided commands with backslash `\` line continuation. Terminus/zsh treated each line as a separate command: `zsh: command not found`.  
**Fix:** Always provide single-line commands for this user.  
**Rule:** This user runs Terminus on macOS with zsh. All commands must be single-line.

### ERROR-005: Tried to run Mac commands from Linux environment
**What happened:** Ran `openclaw` commands in the Linux repo environment. Error: `openclaw: command not found`.  
**Fix:** OpenClaw commands must be run on the Mac. Repo work stays in the Linux environment.  
**Rule:** Clearly distinguish between "run this on your Mac in Terminus" vs repo operations here.

---

## Checklist Before Asking User to Share Output

- [ ] Have I asked for the minimum information needed?
- [ ] Have I QA-tested the redaction command with a mock payload?
- [ ] Does the redaction cover: tokens, botToken, apiKey, paths, URLs, user IDs?
- [ ] Is the command a single line (no backslash continuation)?
- [ ] Have I told the user to verify all `[REDACTED]` tags appear before sharing?
