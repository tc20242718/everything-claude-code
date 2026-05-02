---
name: macmini-ops-runbook
description: Operational procedures, health checks, troubleshooting, and daily maintenance for MacMini-AI-Coach
version: 4.0
source: MacMini handoff v3 (Sections 3, 7, 12) + instructions v1 (Steps 6-9)
lastUpdated: 2026-05-02
---

# MacMini Operational Runbook

Daily and emergency operational procedures for MacMini-AI-Coach. Follow these procedures exactly.

---

## Daily Startup Sequence

**Do this EVERY morning before any operational work.**

### 1. Establish SSH Connection
```bash
# Via Termius on iPhone (agents vault)
# Use Tailscale hostname from Termius config
ssh <your-tailscale-hostname>

# Verify you are on the correct machine
sysctl -n machdep.cpu.brand_string  # Should output: Apple M4 Pro
sw_vers                              # Confirm macOS version
```

### 2. Run Audit Script (Non-Negotiable)
```bash
cd ~ && bash macmini-audit.sh
```
- Script is non-destructive (read-only verification)
- Outputs delta report listing any deviations
- Paste full output into session immediately
- This delta IS your work queue for the day

### 3. Verify All Agents Responsive
Run these health checks in sequence. **All must pass or you have blockers.**

```bash
# NemoClaw (Privacy Sandbox) - Must be responsive
echo "=== NemoClaw Health Check ==="
curl -s http://localhost:9100/health

# Expected output: {"status": "ok", ...}
# If fails: Privacy sandbox is offline - BLOCKER

# Ollama (Local LLM) - Check running models
echo "=== Ollama Model Check ==="
curl -s http://localhost:11434/api/tags | jq '.models[].name'

# Expected: qwen3:14b, deepseek-coder-v2:16b, llama3.1:8b, etc.
# If empty: Ollama running but no models - HIGH PRIORITY

# OpenClaw (Orchestrator)
echo "=== OpenClaw Health Check ==="
curl -s http://localhost:8000/health

# Expected: {"status": "ready", ...}

# Hermes (Executor) 
echo "=== Hermes Health Check ==="
curl -s http://localhost:9000/health

# Expected: {"status": "operational", ...}
```

### 4. Verify Security Posture (Critical)
```bash
# web-search plugin must be DISABLED (known egress vulnerability)
echo "=== Checking web-search plugin status ==="
if ls ~/.openclaw/plugins/ | grep -q web-search; then
  echo "BLOCKER: openclaw-web-search plugin detected - DISABLE IMMEDIATELY"
  exit 1
else
  echo "✓ web-search plugin not loaded"
fi

# LuLu outbound firewall must be active
echo "=== Checking LuLu firewall ==="
/Applications/LuLu.app/Contents/MacOS/LuLu --status 2>/dev/null || {
  if pgrep -x LuLu > /dev/null; then
    echo "✓ LuLu firewall active"
  else
    echo "WARNING: LuLu firewall not running - start in System Settings"
  fi
}

# Ollama must be bound to localhost only (not 0.0.0.0)
echo "=== Checking Ollama network binding ==="
OLLAMA_BINDING=$(lsof -i :11434 2>/dev/null | grep LISTEN)
if echo "$OLLAMA_BINDING" | grep -q "127.0.0.1"; then
  echo "✓ Ollama bound to localhost only (secure)"
elif echo "$OLLAMA_BINDING" | grep -q "0.0.0.0"; then
  echo "BLOCKER: Ollama bound to 0.0.0.0 - exposed to network"
  exit 1
else
  echo "WARNING: Cannot verify Ollama binding"
fi
```

### 5. Verify UniFi Network Health
```bash
echo "=== UniFi Network Check ==="
# (If you have command-line access to UniFi controller)
# Check VLAN segmentation, threat management active, etc.

# At minimum:
# - Confirm wired ethernet connected
# - Verify IP address stable
hostname -I
```

### 6. Review Yesterday's Work
```bash
# Check last session's commits
git log --oneline -n 5

# Review Obsidian daily log
cat ~/Documents/vault/daily.md | tail -20
```

### 7. Get Operator Sign-Off
Present summary:
```
Audit delta: [paste output]
Agent status: [all pass/any failures]
Security posture: [secure/at-risk]
Open blockers: [list any]
Proposed work queue: [high-priority items]

Awaiting operator approval to begin work.
```

---

## Common Operational Tasks

### Task: Check Token Spend and LLM Budgets
```bash
# View OpenRouter API spend (if accessible)
# Cost tracking maintained in SQLite database
sqlite3 ~/.openclaw/cost_tracker.sql << EOF
SELECT model, date, tokens_used, cost FROM usage 
WHERE date >= date('now', '-7 days') 
ORDER BY date DESC, cost DESC;
EOF

# Check current month spend
sqlite3 ~/.openclaw/cost_tracker.sql << EOF
SELECT model, SUM(cost) as total_cost, SUM(tokens_used) as total_tokens 
FROM usage 
WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
GROUP BY model 
ORDER BY total_cost DESC;
EOF
```

**Budget caps per handoff:**
- Per-LLM: $20/month (auto-switch on hit)
- OpenRouter account: $25/month (hard ceiling)

If approaching limits, switch to local Ollama routing (free).

### Task: Rotate LLM Model Weights
```bash
# Edit routing weights based on weekly performance evaluation
# File: ~/.claude/config/llm-routing.yaml

# Current weights: Accuracy 48%, Completeness 32%, Performance 14%, Token Efficiency 6%
# Adjust based on observed performance

# Example: If Gemini underperforming on multimodal tasks, decrease weight
# Then reload OpenClaw to apply
curl -X POST http://localhost:8000/reload
```

### Task: Monitor ClamAV Anti-Malware
```bash
# ClamAV scheduled daily at 3 AM
# Check last scan results
tail -50 /var/log/clamav/clamav.log

# Run manual scan if needed
clamscan -r -i ~/Documents/vault/  # Important: scan vault for contamination
```

### Task: Verify Obsidian Sync Status
```bash
# Check iCloud Advanced Data Protection status
# In System Settings → [Your Name] → iCloud → Advanced Data Protection
# Verify "MacMini-Vault" is syncing without errors

# Alternative: Check local Obsidian vault
ls -lh ~/Documents/vault/.obsidian/sync.json
```

### Task: Review Security Audit Logs
```bash
# Check UniFi IDS/IPS alerts
# (Access via UniFi web dashboard)

# Check firewall block events
log stream --level debug --predicate 'process == "LuLu"' 2>/dev/null | head -20
```

---

## Troubleshooting

### Problem: NemoClaw Not Responding (Port 9100)

**Severity: BLOCKER** — Privacy enforcement offline

```bash
# 1. Verify process running
ps aux | grep -i nemoclaw

# 2. Check port binding
lsof -i :9100

# 3. Check logs (if available)
tail -50 ~/.openclaw/logs/nemoclaw.log

# 4. Restart NemoClaw
pkill -f nemoclaw || true
# (Wait 5 seconds)
cd ~/.openclaw && ./nemoclaw.sh &

# 5. Verify restart
curl -s http://localhost:9100/health | jq .

# If still fails: Do NOT proceed. Session blocked.
```

### Problem: Ollama Not Running or Out of Memory

**Severity: HIGH** — Local inference offline

```bash
# 1. Check Ollama process
ps aux | grep -i ollama

# 2. Check memory usage
free -h
sysctl hw.memsize  # Should show 24 GB available

# 3. Check available models
curl -s http://localhost:11434/api/tags

# 4. If models missing, pull required ones
ollama pull qwen3:14b         # Primary reasoning
ollama pull deepseek-coder-v2:16b  # Code generation
ollama pull llama3.1:8b       # General fallback

# 5. If out of memory, check running tasks
ollama list

# To free memory, stop non-essential model
# (Operator decision)

# 6. If Ollama crashed, restart
pkill -f ollama || true
# Wait 10 seconds
ollama serve &

# 7. Verify restart
curl -s http://localhost:11434/api/tags | jq .
```

### Problem: API Spend Cap Hit (OpenRouter)

**Severity: HIGH** — Cloud routing disabled for that LLM

```bash
# 1. Identify which LLM hit the limit
sqlite3 ~/.openclaw/cost_tracker.sql << EOF
SELECT model, SUM(cost) as total FROM usage 
WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
GROUP BY model 
ORDER BY total DESC;
EOF

# 2. View remaining budget
echo "Per-LLM cap: \$20/month"
echo "Account cap: \$25/month"
echo "Manual calculation of spend vs. limits above"

# 3. If single LLM hit limit, verify auto-switch working
# Check routing config has fallback weights
cat ~/.claude/config/llm-routing.yaml | grep -A 5 "fallback"

# 4. If account cap hit, ALL cloud routing stopped
# Operator decision: increase budget or wait for new month

# 5. If wait required, verify local-only routing active
# Should be ~90% Ollama traffic
```

### Problem: web-search Plugin Accidentally Enabled

**Severity: CRITICAL** — Privacy egress vulnerability

```bash
# 1. IMMEDIATELY stop session
# 2. Do NOT execute any search queries
# 3. IMMEDIATELY disable plugin
rm -rf ~/.openclaw/plugins/openclaw-web-search

# 4. Restart OpenClaw
curl -X POST http://localhost:8000/reload

# 5. Verify disabled
ls ~/.openclaw/plugins/ | grep web-search && echo "FAILED - PLUGIN STILL PRESENT" || echo "OK"

# 6. Forensic audit
# Check if any queries were routed through Brave/SerpAPI/Bing
grep -r "web-search" ~/.openclaw/logs/ 2>/dev/null

# 7. If any egress detected, escalate to operator immediately
```

### Problem: Git Commit Failed (Pre-Action Snapshot)

**Severity: MEDIUM** — Audit trail incomplete

```bash
# 1. Check git status
git status

# 2. If "nothing to commit":
git add -A
git commit -m "pre-action snapshot: manual recovery" || true

# 3. If "merge conflict" or other error:
git log --oneline -n 5
git status

# 4. Resolve based on error, then retry commit

# 5. If unrecoverable:
echo "Git error preventing snapshot. Operator approval required to proceed."
# Stop, wait for operator decision before continuing
```

### Problem: Obsidian Sync Not Syncing (iCloud)

**Severity: MEDIUM** — Daily log not persisting

```bash
# 1. Check Obsidian is open and has network
# (Manually check in Obsidian app)

# 2. Verify iCloud sync credential
# System Settings → [Your Name] → iCloud → Advanced Data Protection
# Password-protect MacMini vault if needed

# 3. Force sync (in Obsidian):
# Cmd + Shift + P → Obsidian Sync: Force sync now

# 4. If still failing:
# Check iCloud status
ls -lh ~/Library/Mobile\ Documents/com~apple~CloudDocs/

# 5. Check vault file permissions
ls -lh ~/Documents/vault/.obsidian/

# 6. If permissions wrong, repair
chmod -R u+rw ~/Documents/vault/
```

### Problem: Unauthorized Cloud Routing (Tier 3/4 Data)

**Severity: CRITICAL** — Privacy violation, session termination

```bash
# If Tier 3 or Tier 4 data was sent to cloud:

# 1. STOP all work immediately
# 2. Do NOT continue session
# 3. Escalate to operator

# Actions (operator decides):
# - Rollback to pre-incident state: git reset --hard <commit-hash>
# - Forensic audit of cloud logs
# - Credential rotation (API keys, tokens)
# - NemoClaw policy review
# - Data tier re-classification
```

---

## Weekly Maintenance

**Run these tasks on Sunday (or low-traffic day):**

### 1. LLM Performance Evaluation
```bash
# Review accuracy, speed, cost per model over past week
sqlite3 ~/.openclaw/cost_tracker.sql << EOF
SELECT model, 
  AVG(accuracy_score) as avg_accuracy,
  AVG(response_time_ms) as avg_latency,
  SUM(cost) as weekly_cost,
  SUM(tokens_used) as total_tokens
FROM usage 
WHERE date >= date('now', '-7 days')
GROUP BY model
ORDER BY avg_accuracy DESC, weekly_cost ASC;
EOF

# Adjust routing weights if needed (see Task: Rotate LLM Model Weights above)
```

### 2. Security Audit
```bash
# Full re-run of macmini-audit.sh (even though daily)
cd ~ && bash macmini-audit.sh > /tmp/audit_weekly.txt

# Compare to previous week
diff /tmp/audit_weekly.txt /tmp/audit_previous_week.txt || echo "No changes detected"

# Any new deviations = action item
```

### 3. Backup Verification
```bash
# Verify iCloud ADP sync completed without errors
# (Check Obsidian app status)

# Verify Proton Drive backup recent
ls -lh ~/Proton\ Drive/ | head -5

# Verify Git history intact
git log --oneline | wc -l  # Should be growing steadily
```

### 4. Cost Analysis
```bash
# Month-to-date spend review
sqlite3 ~/.openclaw/cost_tracker.sql << EOF
SELECT 'Month-to-Date', SUM(cost) as total_spend 
FROM usage 
WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now');

SELECT model, SUM(cost) as model_spend 
FROM usage 
WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
GROUP BY model
ORDER BY model_spend DESC;
EOF

# Verify under \$25/month OpenRouter account ceiling
# Verify each LLM under $20/month cap
```

### 5. Log Archive
```bash
# Compress and archive previous week's logs
gzip -c ~/.openclaw/logs/*.log > ~/.openclaw/logs/archive_week_$(date +%Y%m%d).tar.gz

# Clean up old logs (keep 30 days)
find ~/.openclaw/logs/ -name "*.log" -mtime +30 -delete
```

---

## Monthly Review (First Sunday of Month)

### 1. Full Security Audit
```bash
cd ~ && bash macmini-audit.sh > /tmp/audit_monthly.txt
cat /tmp/audit_monthly.txt
```
Document any changes in Obsidian.

### 2. Hardware Health
```bash
# Thermal status
istats  # If installed, or check in System Settings

# Disk space
df -h | grep "/" | awk '{print $5, "used"}'

# Memory pressure
vm_stat | grep "Pages free"
```

### 3. Network Health
```bash
# Ping gateway (via UniFi)
ping -c 5 192.168.1.1  # (Replace with your gateway)

# Check for packet loss
# (Should be <1%)

# Verify Tailscale active
tailscale status
```

### 4. Cost Reconciliation
```bash
# Compare invoiced costs vs. tracked costs
sqlite3 ~/.openclaw/cost_tracker.sql << EOF
SELECT strftime('%Y-%m', date) as month, 
  SUM(cost) as total_cost,
  COUNT(*) as queries,
  AVG(cost) as avg_cost_per_query
FROM usage
WHERE date >= date('now', '-3 months')
GROUP BY month
ORDER BY month DESC;
EOF

# Report to operator for reconciliation with actual bills
```

### 5. Renewal Dates
```bash
# Check upcoming expirations
echo "SSL Certificates:"
echo "iCloud ADP renewal: [date from System Settings]"
echo "Proton Drive subscription: [date from Proton]"
echo "OpenRouter account: [date from account page]"
```

---

## Emergency Procedures

### Data Breach Suspected (Tier 3/4 Data Leaked)

1. **STOP immediately** — Cease all operations
2. **Isolate** — Disconnect from network if possible
3. **Preserve evidence** — Do NOT delete logs
4. **Escalate** — Notify operator with timeline and evidence
5. **Investigate** — Run forensic audit of cloud logs
6. **Remediate** — Rotate all credentials
7. **Review** — Post-incident security audit

### Hardware Failure (Disk, RAM, CPU)

1. **Back up immediately** via external drive
2. **Shut down gracefully** — Do NOT force power-off
3. **Notify operator** with error symptoms
4. **Repair or replace** per operator decision
5. **Restore from backup** following disaster recovery procedures
6. **Verify** all systems operational post-restore

### Network Isolation (Internet Down, Tailscale Unavailable)

1. **Verify situation** — Ping gateway, check Tailscale status
2. **Continue local work** — Ollama still operational locally
3. **No cloud routing** — All remote LLM calls fail gracefully
4. **Preserve session state** — Git commits still work locally
5. **Resume when restored** — All changes sync when network returns

### Credential Compromise (SSH Key, API Token Leaked)

1. **STOP immediately** — No cloud operations
2. **Rotate credential** — Generate new key/token
3. **Revoke old** — Remove old key/token access
4. **Audit logs** — Check for unauthorized access
5. **Re-secure** — Update all references to old credential
6. **Resume** — Session can restart with new credential

---

## Key References

| Component | Port | Health Check | Troubleshoot |
|-----------|------|--------------|--------------|
| OpenClaw | 8000 | `curl http://localhost:8000/health` | Check startup logs |
| Hermes | 9000 | `curl http://localhost:9000/health` | Verify executor running |
| NemoClaw | 9100 | `curl http://localhost:9100/health` | Privacy offline = BLOCKER |
| Ollama | 11434 | `curl http://localhost:11434/api/tags` | Restart if hung |
| Tailscale | N/A | `tailscale status` | Reconnect if expired |
| LuLu | N/A | `pgrep -x LuLu` | Enable in System Settings |

---

**Version 4.0 | Classification: Confidential | Last Updated: 2026-05-02**

**Follow this runbook exactly. Operator approval required for deviations.**
