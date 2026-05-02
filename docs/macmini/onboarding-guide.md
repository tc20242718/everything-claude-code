---
name: macmini-onboarding-guide
description: New operator training and onboarding procedures for MacMini-AI-Coach
version: 4.0
source: MacMini instructions v1 (Sections 2-3, Steps 1-9) + training materials
lastUpdated: 2026-05-02
---

# MacMini-AI-Coach Onboarding Guide

**For new operators and team members**

This guide walks through the complete setup and first session for someone new to MacMini-AI-Coach. Expected time: 2-3 hours for first complete session.

---

## Pre-Onboarding Checklist (For Existing Admin)

Before bringing on a new operator, verify:

- [ ] Hardware installed and configured (Phase 2)
- [ ] Agent stack deployed (Phase 3)
- [ ] Security hardening complete (Phase 4)
- [ ] Operator has SSH access (Tailscale key in Termius)
- [ ] Operator has read access to documentation
- [ ] Operator has Obsidian vault access (iCloud ADP)
- [ ] Operator has approved by compliance/security

---

## Part 1: Environment Setup (30 minutes)

### Step 1.1: Install Required Tools

**On your Mac (if not already installed):**

```bash
# Install Homebrew (if not present)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install jq curl git

# Verify installations
which curl jq git node  # All should exist
```

### Step 1.2: Configure SSH Access (Termius)

1. **Download Termius** from App Store (if on iPhone)
   - Or use Termius web/desktop if on different device

2. **Import SSH Connection:**
   - In Termius, create new Host
   - **Host:** [Your Tailscale hostname]
   - **Port:** 22
   - **Username:** [Your macOS username]
   - **Auth Type:** Public Key
   - **Private Key:** [Import from your ~/.ssh/id_ed25519]

3. **Test Connection:**
   ```bash
   # In Termius, connect to MacMini
   # Should show: [you@macmini ~]
   ```

4. **Create Termius Vaults** (operational segmentation):
   - **agents** vault — Agent configs, prompts
   - **network** vault — UniFi rules, Tailscale config
   - **metrics** vault — Performance logs
   - **sync** vault — Git/iCloud/Proton credentials
   - **debug** vault — Logs, error traces
   - **security** vault — Firewall rules, threat intel

### Step 1.3: Verify Network Connectivity

```bash
# After SSH connection is established, run:
ping -c 3 8.8.8.8              # Should succeed
sysctl -n machdep.cpu.brand_string  # Should show: Apple M4 Pro
hostname                        # Should show: macmini (or configured)
```

---

## Part 2: Understanding Architecture (45 minutes)

### Step 2.1: Read Core Documentation

Read in this order (skim is OK):

1. **`MACMINI.md`** (5 min) — Overview and navigation
2. **`agents/macmini-ai-coach.md`** (15 min) — Architecture, agent stack, design principles
3. **`rules/macmini/session-rules.md`** (15 min) — Operating rules, mandatory protocols
4. **`docs/macmini/ops-runbook.md`** (10 min) — Daily operations checklist

### Step 2.2: Understand Five-Tier Agent Stack

```
Your Terminal (SSH)
       ↓
[OpenClaw :8000] — Orchestrator/Router
       ↓
[Hermes :9000] — Executor/Versioning
       ↓
[NemoClaw :9100] — Privacy Enforcement (CRITICAL)
       ↓
[Ollama :11434] — Local LLM (Free, M4-optimized)
       ↓
[Claude/Grok/Gemini/etc] — Cloud fallback (Paid, via OpenRouter)
```

**Remember:** Local-first (Ollama) for ~90% of queries. Cloud only when necessary. NemoClaw enforces privacy tier rules.

### Step 2.3: Understand Data Classification

| Tier | Example | Where Allowed | Where Blocked |
|------|---------|---|---|
| **1: Public** | "Hello world" | Anywhere | Nowhere |
| **2: Confidential** | "Meeting notes" | Obsidian, Proton, iCloud | Telegram, Discord, Slack, web |
| **3: HC-External-Review** | "Legal strategy" | Obsidian + advisors | Most clouds |
| **4: HC-Not-External** | "Client accounts" | LOCAL ONLY | ALL cloud (hard block) |

**Critical Rule:** Tier 4 data NEVER on cloud. NemoClaw enforces as unoverridable veto.

---

## Part 3: First Session (1-2 hours)

### Step 3.1: SSH Connection and Audit

```bash
# In Termius, connect to Mac Mini
ssh macmini.tailscale

# Verify you're on correct machine
sysctl -n machdep.cpu.brand_string  # Show Apple M4

# RUN AUDIT (non-negotiable, run before anything else)
cd ~ && bash macmini-audit.sh

# Output will show:
# ✓ NemoClaw responding
# ✓ Ollama models loaded
# ✓ OpenClaw orchestrator ready
# ✓ Hermes executor ready
# [Any issues listed as WARNING or FAIL]
```

### Step 3.2: Verify Security Posture

**Health Checks (all must PASS):**

```bash
# 1. NemoClaw (Privacy enforcement) — CRITICAL
curl -s http://localhost:9100/health | grep -q '"status"' && echo "✓ NemoClaw OK" || echo "✗ FAIL"

# 2. Ollama (Local LLM)
curl -s http://localhost:11434/api/tags | grep -q "models" && echo "✓ Ollama OK" || echo "✗ FAIL"

# 3. OpenClaw (Orchestrator)
curl -s http://localhost:8000/health | grep -q '"status"' && echo "✓ OpenClaw OK" || echo "✗ FAIL"

# 4. Hermes (Executor)
curl -s http://localhost:9000/health | grep -q '"status"' && echo "✓ Hermes OK" || echo "✗ FAIL"

# 5. web-search plugin disabled (security)
ls ~/.openclaw/plugins/ | grep -q web-search && echo "✗ FAIL: web-search enabled!" || echo "✓ web-search disabled"

# 6. Ollama localhost-only (not exposed to network)
lsof -i :11434 | grep -q "127.0.0.1" && echo "✓ Ollama localhost-only" || echo "✗ FAIL: exposed"

# If ANY health check FAILS: STOP and contact administrator
```

### Step 3.3: Understand Pre-Action Snapshot Discipline

**Before any work, memorize this sequence:**

```bash
# 1. SNAPSHOT (capture current state)
git add -A && git commit -m "pre-action snapshot: [what you're about to do]"

# 2. DOCUMENT rollback (what command reverses your change)
echo "Rollback: git reset --hard HEAD~1" > rollback.txt

# 3. EXECUTE your task

# 4. VERIFY outcome worked

# 5. COMMIT result (capture completion)
git add -A && git commit -m "complete: [task] — [result]"

# 6. LOG to Obsidian (record what happened)
echo "## 2026-05-02T14:30 — [Task]
Result: [Outcome]
Rollback: git reset --hard HEAD~1" >> ~/Documents/vault/daily.md
```

**This discipline is MANDATORY. No exceptions.**

### Step 3.4: Create Your First Session Log

```bash
# Open Obsidian on your Mac (if installed locally)
# Or create via SSH:

cat > ~/Documents/vault/daily-2026-05-02.md << 'EOF'
# Daily Log — 2026-05-02

## Session Start
- Time: $(date)
- Operator: [Your name]
- Status: Onboarding first session

## Audit Results
[Paste audit output here]

## Health Checks Performed
- ✓ NemoClaw: OK
- ✓ Ollama: OK  
- ✓ OpenClaw: OK
- ✓ Hermes: OK
- ✓ web-search: disabled
- ✓ Ollama: localhost-only

## First Impressions
- [What worked well?]
- [Any confusing parts?]
- [Questions for administrator?]

## Decisions Made
[None on first session]

## Next Session
[To be determined by administrator]

---
EOF
```

---

## Part 4: Common First-Session Tasks

### Task A: Query Local LLM

```bash
# Simple test to verify Ollama working

# Option 1: Via curl
curl -X POST http://localhost:11434/api/generate \
  -d '{
    "model": "llama3.1:8b",
    "prompt": "What is artificial intelligence? Keep it brief.",
    "stream": false
  }' | jq '.response'

# Expected: 2-3 sentence explanation

# Option 2: Verify via OpenClaw
curl -X POST http://localhost:8000/route \
  -d '{"query":"hello","sensitivity":"low"}' | jq .
```

### Task B: Check Cost Budget

```bash
# View current month spending
sqlite3 ~/.openclaw/cost_tracker.sql << EOF
SELECT model, 
  SUM(cost) as spend,
  COUNT(*) as queries
FROM usage
WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
GROUP BY model;
EOF

# Expected output:
# claude|12.50|245
# grok|5.20|98
# (totals should be under $25/month)
```

### Task C: Verify Pre-Action Snapshot Works

```bash
# Test rollback procedure (safe)

# Create test file
echo "test" > ~/test-file.txt

# Pre-action snapshot
git add -A && git commit -m "test: rollback procedure"

# Verify commit created
git log --oneline | head -1

# Rollback
git reset --hard HEAD~1

# Verify file gone
[ -f ~/test-file.txt ] && echo "FAIL: rollback didn't work" || echo "OK: rollback successful"
```

---

## Part 5: Key Operating Rules (15 minutes)

### Rule 1: Always Run Audit First

**Every session starts with:**
```bash
cd ~ && bash macmini-audit.sh
```
The audit output IS your work queue. Don't create work items outside the audit.

### Rule 2: Pre-Action Snapshots (Mandatory)

Before any file change:
```bash
git add -A && git commit -m "pre-action snapshot: <description>"
```
Enables rollback if anything goes wrong.

### Rule 3: Health Checks (Critical)

Before any cloud routing:
```bash
curl http://localhost:9100/health  # NemoClaw MUST be responding
```
If NemoClaw is down, NO cloud operations. Period.

### Rule 4: Data Classification Matters

- **Don't guess** which tier data belongs in
- **Ask administrator** if unsure
- **Tier 4 data NEVER goes to cloud** — NemoClaw blocks it
- **Tier 3 data only to approved advisors**

### Rule 5: HITL Approval Gates

**Stop and get explicit approval before:**
- Accessing Tier 3/4 data
- Changing agent configuration
- Rotating credentials
- Changing UniFi/Tailscale/firewall

---

## Part 6: Emergency Procedures (10 minutes)

### Emergency 1: NemoClaw Not Responding

```bash
# STOP all work immediately
# This is a BLOCKER

# Check if running
ps aux | grep nemoclaw

# Restart NemoClaw (if admin gives permission)
pkill -f nemoclaw || true
# Wait 5 seconds
cd ~/.openclaw && ./nemoclaw.sh &

# Verify restart
curl -s http://localhost:9100/health | jq .

# If still fails: Wait for administrator to fix
```

### Emergency 2: Accidentally Send Tier 4 Data to Cloud

```bash
# IMMEDIATELY STOP

# Step 1: Document what happened
echo "Incident: Tier 4 data may have been cloud-routed
Time: $(date)
Details: [what happened]" > ~/incident-report.txt

# Step 2: Do NOT delete logs
# (They're evidence for investigation)

# Step 3: Escalate to administrator with incident report
cat ~/incident-report.txt
```

### Emergency 3: Forgot Pre-Action Snapshot

```bash
# If you made changes and forgot to snapshot:

# DO NOT panic, you can still create a snapshot
git add -A && git commit -m "recovery: snapshot of unsaved work"

# But best practice is to always snapshot FIRST
```

---

## Part 7: Frequently Asked Questions

**Q: Can I use Claude.ai web instead of Claude Code?**
A: NO for Tier 3/4 data. Always use Claude Code on Mac Mini for sensitive work. Claude.ai is not private.

**Q: What if I make a mistake?**
A: That's why we have pre-action snapshots. Rollback with: `git reset --hard HEAD~1`

**Q: How much does it cost?**
A: Local (Ollama) = free. Cloud (Claude/Grok) = ~$20/month per LLM, max $25/month total.

**Q: What if the Internet goes down?**
A: Ollama still works locally. Cloud routing fails gracefully. No data loss.

**Q: Can I enable web-search to find current information?**
A: NOT until administrator confirms the egress vulnerability is fixed. It's currently disabled.

**Q: How do I get help?**
A: Check `docs/macmini/ops-runbook.md` Troubleshooting section. If stuck, contact administrator with:
- What you were trying to do
- What happened
- The audit output
- Any error messages

---

## Part 8: Homework (Before Next Session)

1. **Read twice:**
   - `MACMINI.md` (root navigation)
   - `rules/macmini/session-rules.md` (operating rules)

2. **Understand:**
   - The five-agent stack and how they work together
   - The four data tiers and what goes where
   - The pre-action snapshot discipline

3. **Complete:**
   - Get familiar with Termius 8-Vault for credential storage
   - Set up Obsidian on your Mac (optional but recommended)
   - Verify all health checks pass on next login

4. **Ask questions:**
   - Write down anything confusing
   - Ask administrator before your next session

---

## Next Steps

**After completing this onboarding:**

1. ✓ You understand architecture
2. ✓ You've verified hardware is working
3. ✓ You know the operating rules
4. ✓ You know emergency procedures

**Next session with administrator:**
- Present what you've learned
- Ask clarifying questions
- Get approval to execute real work items
- Begin handling actual audit deltas

---

## Quick Reference Card

Print or save locally:

```
=== MacMini-AI-Coach Quick Reference ===

Daily Startup:
1. SSH in: ssh macmini.tailscale
2. Run audit: cd ~ && bash macmini-audit.sh
3. Health checks: curl http://localhost:9100/health (all must pass)
4. Get approval on work items

Pre-Action Snapshot:
git add -A && git commit -m "pre-action: <what you're doing>"

Key Ports:
- NemoClaw (Privacy): :9100
- Hermes (Executor): :9000
- OpenClaw (Router): :8000
- Ollama (Local LLM): :11434

Critical Rules:
- Tier 4 data NEVER on cloud
- NemoClaw must be responding before cloud operations
- Pre-action snapshot ALWAYS before changes
- HITL approval for sensitive operations

Emergency:
- NemoClaw down = STOP all work
- Tier 4 data on cloud = ESCALATE to admin
- Forgot snapshot = Create one ASAP with: git commit

Contact: [Administrator email/contact]
```

---

**Version 4.0 | Classification: Confidential | Last Updated: 2026-05-02**

**Welcome to MacMini-AI-Coach! You now have the knowledge to safely and effectively operate the system.**
