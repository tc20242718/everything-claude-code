# Mac Mini Verification Checklist

Run this on the Mac Mini after merging `claude/upgrade-telegram-cBTet`. Each step has a copy/paste command and a clear pass/fail signal. If any step fails, see the linked entry in `skills/openclaw-telegram-ops/SKILL.md`.

---

## 0. Setup

```bash
cd ~/path/to/everything-claude-code
git pull
```

---

## 1. Pre-flight audit (must show 0 issues)

```bash
bash macmini-audit.sh
```

PASS when the final line reads `All checks passed — ready to proceed`. If any `[FAIL]` or `[WARN]` lines appear above the summary, run the suggested fix and re-run.

Critical signals:
- `Ollama: single process running` (not `Multiple Ollama processes detected`)
- `Telegram channel: connected` (not `401 Unauthorized`)
- `dmPolicy: allowlist` (not `dmPolicy=pairing`)
- `OpenClaw gateway running on localhost:18789`

---

## 2. Apply the dmPolicy fix (one-time)

If audit step 1 flagged `dmPolicy=pairing`:

```bash
openclaw config set channels.telegram.dmPolicy allowlist
openclaw gateway --force
```

Wait ~5s for the gateway to come back up, then:

```bash
openclaw health
```

PASS when telegram shows `connected` and agents shows `1 ready`.

---

## 3. End-to-end Telegram tests

From your iPhone:

| # | Send | Expect |
|---|---|---|
| 1 | `/help` | Slash command help text returned within 3s |
| 2 | `hi` | Natural language reply from `qwen3:14b` within 10s |
| 3 | `what is 2+2?` | Numeric answer (`4`) |
| 4 | A 200-word prompt | Coherent multi-paragraph reply, no truncation |
| 5 | `/help` (again) | Still returns slash help — confirms slash routing didn't break after dmPolicy change |

If step 2 fails silently (no reply), re-check `dmPolicy` and re-run step 2.
If reply takes >30s, run `ps aux | grep ollama | grep -v grep | wc -l` — must be 1.

---

## 4. Concurrent-load smoke test

Send 3 messages in quick succession from the iPhone (e.g. `one`, `two`, `three`). Confirm all 3 receive distinct, correct replies in the order sent. Then:

```bash
openclaw logs | tail -50
```

PASS when there are no `error`, `warn`, `401`, or `FailoverError` entries.

---

## 5. Restart resilience

```bash
openclaw gateway --force
```

After ~5s, send `/help` from iPhone. PASS if reply arrives within 5s (no first-message timeout).

```bash
pkill -f ollama
sleep 3
ollama serve &
sleep 5
```

Send a plain text message from iPhone. PASS if reply arrives within 15s (slightly slower due to model cold-load is acceptable).

---

## 6. Regression sweep — verify the 6 documented issues stay fixed

Re-run `bash macmini-audit.sh` and confirm every check from `skills/openclaw-telegram-ops/SKILL.md` reports green:

| # | Issue | Audit signal |
|---|---|---|
| 1 | Multiple Ollama processes | `Ollama: single process running` |
| 2 | Telegram 401 Unauthorized | `Telegram channel: connected` |
| 3 | Gateway mode stuck on remote | `OpenClaw gateway running on localhost:18789` |
| 4 | Wrong/stale model (`kimi/k2p5`) | No `FailoverError` in `openclaw logs` |
| 5 | Messages pending / no reply | Step 3 above all passed |
| 6 | dmPolicy=pairing blocks plain text | `dmPolicy: allowlist` |

---

## 7. Optional cleanup — retire legacy `bot.py`

OpenClaw now handles Telegram natively. Once steps 1–6 pass, the standalone `bot.py` is no longer needed:

```bash
launchctl unload ~/Library/LaunchAgents/com.macmini.telegram-bot.plist 2>/dev/null
launchctl list | grep com.macmini.telegram-bot   # must return nothing
```

Keep the venv and source for now — only remove after a week of stable OpenClaw operation.

---

## Sign-off

When every step above passes, this upgrade is QA-complete. Document the test run in this file with date + duration:

- Verified by: __________
- Date: __________
- iPhone reply time (median, 5 messages): _____ s
- Notes: __________
