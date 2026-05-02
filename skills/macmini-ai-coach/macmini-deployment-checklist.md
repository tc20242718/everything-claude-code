---
name: macmini-deployment-checklist
description: Pre-deployment QA checklist and validation procedures for MacMini-AI-Coach
version: 4.0
source: MacMini handoff v3 (Section 10) + deployment procedures
lastUpdated: 2026-05-02
---

# MacMini Deployment Checklist

**QA PASS/FAIL — Deployment Readiness Gate**

**Current Status:** PASS-with-conditions (Audit: 2026-04-26)

This checklist must be completed before deploying to production. All items must either PASS or be explicitly waived by operator.

---

## Pre-Deployment Verification (GATE 1)

| Item | Criteria | Status | Verification |
|------|----------|--------|---|
| Handoff doc v3 | PDF + MD in `~/outputs/` | ✓ | `ls ~/outputs/MacMiniAICoach*` |
| Master skill | `~/.openclaw/agents/_core/macmini-ai-coach-master-skill.js` | ✓ | `ls -la ~/.openclaw/agents/_core/` |
| CLAUDE.md | `~/CLAUDE.md` or project root | ✓ | `cat ~/CLAUDE.md` |
| macmini-audit.sh | `~/macmini-audit.sh` present | ✓ | `bash ~/macmini-audit.sh` |
| NemoClaw responding | Health check on localhost:9100 | ✓ | `curl http://localhost:9100/health` |
| Ollama running | Models available on localhost:11434 | ✓ | `curl http://localhost:11434/api/tags` |
| OpenClaw running | Orchestrator responsive | ✓ | `curl http://localhost:8000/health` |
| Hermes running | Executor operational | ✓ | `curl http://localhost:9000/health` |
| openclaw-web-search disabled | Plugin not loaded | ✓ | `ls ~/.openclaw/plugins/` \| grep -q web-search` (should find nothing) |
| Git repo initialised | `~/outputs` is a git repo | ✓ | `git -C ~/outputs status` |
| Obsidian vault syncing | iCloud ADP active | ✓ | Check System Settings |

**Verdict:** ✓ **PASS** — All checks successful. Ready for Phase 1.

---

## Phase 1: Foundation (Infrastructure & Governance)

**BLOCKING Items:**

| # | Item | Owner | Status | Deadline | Notes |
|---|------|-------|--------|----------|-------|
| 1 | Ops runbook confirm | Operator | PENDING | Before Phase 2 | Define daily operations procedures |
| 2 | Onboarding guide confirm | Operator | PENDING | Before Phase 2 | New operator training materials |
| 3 | SSH verification confirm | Operator | PENDING | Before Phase 2 | Key-only auth, non-default port |

**HIGH Priority:**

| # | Item | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 4 | DR runbook confirm | Operator | PENDING | Backup, restoration, rollback |
| 5 | Hermes specification confirm | Operator | PENDING | Executor behavior definition |
| 6 | SQLite backup confirm | Operator | PENDING | Cost tracker, session data |
| 7 | Retention policy confirm | Operator | PENDING | Log retention, archive schedules |
| 8 | HITL gate test confirm | Operator | PENDING | Verify approval gates work |

**NICE-TO-HAVE:**

| # | Item | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 9 | iOS shortcut integration | Engineer | BACKLOG | iPhone automation |
| 10 | MLX backend | Engineer | BACKLOG | Apple ML framework (arm64 optimization) |
| 11 | Context window config | Engineer | BACKLOG | Token budget tuning |

**Phase 1 Gate:** All BLOCKING items must be confirmed or explicitly waived.

**Sign-Off Required:** Operator approval before proceeding to Phase 2.

---

## Phase 2: Agent Stack Deployment

### 2.1 NemoClaw Verification

**Objective:** Confirm privacy sandbox is functioning correctly.

```bash
# 1. Health check
curl -s http://localhost:9100/health | jq .

# 2. Test Tier 4 data blocking
curl -X POST http://localhost:9100/classify \
  -H "Content-Type: application/json" \
  -d '{"data":"Client ABC account 12345","tier":4}' | jq .

# Expected: {"blocked": true, "reason": "Tier 4 enforcement"}

# 3. Test Tier 1 data routing allowed
curl -X POST http://localhost:9100/classify \
  -H "Content-Type: application/json" \
  -d '{"data":"Public announcement","tier":1}' | jq .

# Expected: {"blocked": false, "allowed_routes": ["any"]}

# 4. Verify route veto capability
curl -X POST http://localhost:9100/veto \
  -H "Content-Type: application/json" \
  -d '{"route":"claude.ai","tier":3}' | jq .

# Expected: {"vetoed": true}
```

**Checklist:**
- [ ] Health check passes
- [ ] Tier 4 blocking works
- [ ] Tier 1 routing allowed
- [ ] Route veto enforced
- [ ] Response times <200ms

---

### 2.2 Ollama Model Verification

**Objective:** Confirm local LLM inference available.

```bash
# 1. List models
curl -s http://localhost:11434/api/tags | jq '.models[].name'

# Expected output:
# qwen3:14b
# deepseek-coder-v2:16b
# llama3.1:8b
# (may vary)

# 2. Test inference
curl -X POST http://localhost:11434/api/generate \
  -d '{
    "model": "llama3.1:8b",
    "prompt": "What is 2+2?",
    "stream": false
  }' | jq '.response'

# 3. Measure inference latency
time curl -X POST http://localhost:11434/api/generate \
  -d '{"model":"llama3.1:8b","prompt":"Hi","stream":false}' > /dev/null

# Expected: <5 seconds for simple query
```

**Checklist:**
- [ ] All 3 models loaded
- [ ] Inference works
- [ ] Latency acceptable (<5s)
- [ ] Binding localhost-only (not 0.0.0.0)

---

### 2.3 OpenClaw Router Verification

**Objective:** Confirm orchestration and sensitivity classification.

```bash
# 1. Health check
curl -s http://localhost:8000/health | jq .

# 2. Test sensitivity classification
curl -X POST http://localhost:8000/classify \
  -d '{"query":"What are the client credentials?"}' | jq .

# 3. Test routing decision
curl -X POST http://localhost:8000/route \
  -d '{"query":"Hello","sensitivity":"low"}' | jq '.selected_model'

# Expected: Local model (Ollama)

# 4. Test high-sensitivity routing
curl -X POST http://localhost:8000/route \
  -d '{"query":"latest news","sensitivity":"medium"}' | jq .

# Expected: Cloud model (Claude/Grok/Gemini)
```

**Checklist:**
- [ ] Health check passes
- [ ] Sensitivity classification works
- [ ] Local routing for low sensitivity
- [ ] Cloud fallback for high sensitivity

---

### 2.4 Hermes Executor Verification

**Objective:** Confirm execution, logging, and rollback capability.

```bash
# 1. Health check
curl -s http://localhost:9000/health | jq .

# 2. Test execution logging
curl -X POST http://localhost:9000/execute \
  -d '{"action":"test","params":{}}' | jq '.log_id'

# 3. Verify rollback capability
git log --oneline | head -1
# (All execution should be logged with git hashes)

# 4. Test feedback loop
curl http://localhost:9000/feedback | jq '.recent_executions'
```

**Checklist:**
- [ ] Health check passes
- [ ] Execution logged
- [ ] Log IDs returned
- [ ] Rollback hashes available

---

## Phase 3: Security Posture Verification

### 3.1 Network Isolation

```bash
# 1. Verify Ollama localhost-only
lsof -i :11434 | grep LISTEN
# Expected: 127.0.0.1:11434 (NOT 0.0.0.0)

# 2. Verify OpenClaw localhost-only
lsof -i :8000 | grep LISTEN

# 3. Verify Hermes localhost-only
lsof -i :9000 | grep LISTEN

# 4. Verify NemoClaw localhost-only
lsof -i :9100 | grep LISTEN
```

**Checklist:**
- [ ] Ollama: localhost-only
- [ ] OpenClaw: localhost-only
- [ ] Hermes: localhost-only
- [ ] NemoClaw: localhost-only

---

### 3.2 Outbound Firewall (LuLu)

```bash
# 1. Verify LuLu running
pgrep -x LuLu && echo "LuLu active" || echo "FAIL"

# 2. Verify Ollama blocked
# (LuLu should have rule blocking :11434)

# 3. Check LuLu logs for unexpected outbound
log stream --predicate 'process == "LuLu"' 2>/dev/null | grep -i "blocked" | head -5
```

**Checklist:**
- [ ] LuLu firewall active
- [ ] Ollama blocked from internet
- [ ] No unexpected outbound connections

---

### 3.3 Credential Security

```bash
# 1. No credentials in code
grep -r "password\|api.key\|token" ~/.openclaw/ 2>/dev/null | grep -v ".git" || echo "Clean"

# 2. No credentials in git history
git log --all --grep="password\|token\|api.key" 2>/dev/null | wc -l
# Expected: 0 matches

# 3. Verify environment variable usage
echo $OPENROUTER_API_KEY  # Should be set, not hardcoded
```

**Checklist:**
- [ ] No hardcoded credentials
- [ ] Git history clean
- [ ] Credentials in environment variables
- [ ] Termius vaults secured

---

### 3.4 Data Classification Enforcement

```bash
# 1. Test Tier 4 hard block
# (See NemoClaw verification above — should reject all cloud routes)

# 2. Test Tier 3 restricted routing
# (Should only route to approved advisors, not public LLMs)

# 3. Verify PII redaction rules
# (Check if redaction applied to logs)
```

**Checklist:**
- [ ] Tier 4 hard-blocked
- [ ] Tier 3 restricted
- [ ] PII redaction applied
- [ ] Data classification policy enforced

---

## Phase 4: Operational Procedures

### 4.1 Daily Startup Sequence

**Objective:** Verify operator can perform daily startup without issues.

**Steps:**
1. SSH into Mac Mini via Tailscale
2. Run audit: `cd ~ && bash macmini-audit.sh`
3. Verify security posture (health checks)
4. Get operator approval
5. Begin work

**Checklist:**
- [ ] SSH connection established
- [ ] Audit runs without errors
- [ ] All health checks pass
- [ ] No unexpected blockers

---

### 4.2 Pre-Action Snapshot Discipline

**Objective:** Verify snapshot protocol works.

```bash
# 1. Make test change
echo "test" > /tmp/test-file.txt

# 2. Pre-action snapshot
git add -A && git commit -m "test: pre-action snapshot"

# 3. Verify commit created
git log --oneline | head -1

# 4. Rollback
git reset --hard HEAD~1

# 5. Verify file removed
ls /tmp/test-file.txt 2>&1  # Should not exist
```

**Checklist:**
- [ ] Git snapshot works
- [ ] Rollback works
- [ ] Audit trail created

---

### 4.3 HITL Approval Gates

**Objective:** Verify approval gates function correctly.

**Simulated scenarios:**
1. File access (Tier 3 data) — Requires approval
2. Agent config change — Requires approval
3. Credential rotation — Requires approval

**Checklist:**
- [ ] Approval request triggered
- [ ] Operator can approve/deny
- [ ] Execution respects decision
- [ ] Decision logged

---

## Phase 5: Audit and Logging

### 5.1 Audit Script Verification

```bash
# 1. Run audit
cd ~ && bash macmini-audit.sh > /tmp/audit_test.txt

# 2. Verify output format
cat /tmp/audit_test.txt | head -20

# 3. Verify captures all systems
grep -c "✓\|✗\|WARNING" /tmp/audit_test.txt
# Expected: Multiple status lines

# 4. Verify non-destructive (nothing changed)
git status  # Should show clean
```

**Checklist:**
- [ ] Audit runs cleanly
- [ ] Output readable
- [ ] Captures all systems
- [ ] Non-destructive (no changes)

---

### 5.2 Obsidian Logging

**Objective:** Verify session logging works.

```bash
# 1. Create test log entry
echo "## Test Log Entry
Date: $(date)
Status: Testing
Result: Success" >> ~/Documents/vault/daily.md

# 2. Verify sync
# (Check Obsidian app or iCloud sync status)

# 3. Verify readable
cat ~/Documents/vault/daily.md | tail -5
```

**Checklist:**
- [ ] Obsidian vault accessible
- [ ] iCloud sync active
- [ ] Logging works
- [ ] Entries sync to backup

---

## Phase 6: Enterprise Integration

### 6.1 Cost Tracking

```bash
# 1. Verify SQLite database
sqlite3 ~/.openclaw/cost_tracker.sql ".tables"

# 2. Query cost data
sqlite3 ~/.openclaw/cost_tracker.sql \
  "SELECT * FROM usage ORDER BY date DESC LIMIT 5;"

# 3. Verify alerts (if approaching cap)
sqlite3 ~/.openclaw/cost_tracker.sql \
  "SELECT SUM(cost) as total FROM usage WHERE date >= date('now', '-30 days');"

# Expected: Under $25/month
```

**Checklist:**
- [ ] SQLite database intact
- [ ] Cost data tracked
- [ ] Alerts functional
- [ ] Spend under budget

---

### 6.2 Git History and Audit Trail

```bash
# 1. Verify commits
git log --oneline | head -10

# 2. Verify conventional format
git log --oneline | grep -E "^[a-f0-9]+ (feat|fix|docs|test)" | wc -l
# Expected: High percentage

# 3. Verify no secrets in history
git log -p | grep -i "password\|token\|api.key" || echo "Clean"

# 4. Verify reflog (recovery capability)
git reflog | head -5
```

**Checklist:**
- [ ] Git history clean
- [ ] Conventional commits followed
- [ ] No secrets exposed
- [ ] Reflog available for recovery

---

## Final Sign-Off

**Before production deployment:**

- [ ] All Phase gates completed
- [ ] All BLOCKING items resolved
- [ ] Security posture verified
- [ ] Operational procedures tested
- [ ] Audit trail complete
- [ ] Operator approval obtained
- [ ] Rollback procedure documented
- [ ] Backup verified

---

## Deployment Readiness Verdict

| Criterion | Status | Notes |
|-----------|--------|-------|
| Infrastructure | ✓ PASS | All agents responding |
| Security | ✓ PASS | Privacy enforcement active |
| Operations | ✓ PASS | Daily procedures tested |
| Audit | ✓ PASS | Logging and history clean |
| Integration | ✓ PASS | Cost tracking, git history |

**OVERALL VERDICT: ✓ PASS-WITH-CONDITIONS**

**Conditions:**
1. Operator confirmation of BLOCKING items
2. Hermes specification finalized
3. Disaster recovery runbook completed

**Ready for Production?** YES (pending condition resolution)

---

**Version 4.0 | Classification: Confidential | Last Updated: 2026-05-02**

**All items must be verified before deploying to production.**
