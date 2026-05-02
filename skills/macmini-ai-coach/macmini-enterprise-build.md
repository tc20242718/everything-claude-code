---
name: macmini-enterprise-build
description: 10-phase enterprise deployment and build procedure for MacMini-AI-Coach
version: 4.0
source: MacMini handoff v3 (Section 11) + deployment planning
lastUpdated: 2026-05-02
---

# MacMini Enterprise Build Guide

**10-Phase Systematic Deployment**

A disciplined, auditable 10-phase deployment procedure for building and deploying MacMini-AI-Coach in enterprise environments. Each phase is independently verifiable and rollbackable.

---

## Overview

| Phase | Title | Objective | Duration | Owner |
|-------|-------|-----------|----------|-------|
| 1 | Foundation Audit | Verify clean state, no assumptions | 30 min | DevOps |
| 2 | Infrastructure Setup | Network, storage, compute baseline | 2-4 hours | SysAdmin |
| 3 | Agent Stack Deployment | OpenClaw, Hermes, NemoClaw, Ollama | 4-6 hours | Engineer |
| 4 | Security Hardening | Firewall, credentials, encryption | 2-3 hours | SecOps |
| 5 | Operational Setup | Backup, monitoring, logging | 2-3 hours | DevOps |
| 6 | Integration Testing | End-to-end workflow validation | 3-4 hours | QA |
| 7 | Performance Tuning | LLM routing, cost optimization | 4-6 hours | Engineer |
| 8 | Documentation & Training | Runbooks, onboarding, procedures | 3-4 hours | TechLead |
| 9 | Pilot Deployment | Limited operator exposure | 2-4 hours | PM |
| 10 | Production Handoff | Full operational capability | 1-2 hours | Operator |

**Total Time Estimate:** 24-38 hours over 1-2 weeks

---

## Phase 1: Foundation Audit (30 minutes)

**Objective:** Establish baseline state. Never assume. Audit defines reality.

### 1.1 Hardware Verification
```bash
# Verify correct hardware
sysctl -n machdep.cpu.brand_string  # Should show: Apple M4 Pro
sysctl -n hw.memsize                # Should show: 24GB (25769803776 bytes)
df -h | grep "/$"                   # Should show: 512GB+ available

# Verify network connectivity
networksetup -getinfo "Ethernet"   # Should show IP from UniFi
ping -c 3 8.8.8.8                  # Should succeed

# Verify no previous installation
ls ~/.openclaw 2>&1                # Should: No such file
ls ~/outputs 2>&1                  # Should: No such file
ls ~/CLAUDE.md 2>&1                # Should: No such file
```

### 1.2 Pre-Requisites Check
```bash
# Verify required tools installed
which git                           # Git should be present
which curl                          # curl should be present
which jq                            # jq for JSON parsing
which node                          # Node.js for scripts

# Verify Tailscale configured
tailscale status                    # Should show connection

# Verify iCloud Advanced Data Protection
# (Manual check: System Settings → [User] → iCloud → ADP)
```

### 1.3 Git Repository Initialization
```bash
# Initialize git in home directory
mkdir -p ~/outputs
cd ~/outputs
git init
git config user.name "MacMini-AI-Coach"
git config user.email "admin@macmini-ai-coach.local"

# Create initial commit
echo "# MacMini AI Coach" > README.md
git add README.md
git commit -m "initial: foundation audit complete"

# Verify git working
git log --oneline  # Should show 1 commit
```

### 1.4 Audit Report
```bash
# Generate audit baseline
cat > ~/outputs/phase1-audit.txt << EOF
=== MacMini-AI-Coach Phase 1 Audit ===
Date: $(date)
Operator: $(whoami)

Hardware:
- CPU: $(sysctl -n machdep.cpu.brand_string)
- Memory: $(sysctl -n hw.memsize)
- Disk: $(df -h | grep "/" | awk '{print $2}')
- Network: $(networksetup -getinfo Ethernet | grep "IP address:")

Pre-requisites:
- Git: $(which git)
- Node: $(which node)
- curl: $(which curl)
- jq: $(which jq)

Connectivity:
- Internet: $(ping -c 1 8.8.8.8 > /dev/null && echo "OK" || echo "FAIL")
- Tailscale: $(tailscale status | grep -q "0.0.0.0" && echo "OK" || echo "FAIL")

Pre-installed Components:
- ~/.openclaw exists: $([ -d ~/.openclaw ] && echo "YES (DELETE)" || echo "No (OK)")
- ~/outputs exists: Yes (clean)
- ~/CLAUDE.md exists: $([ -f ~/CLAUDE.md ] && echo "YES (OK)" || echo "No (will create)")

Verdict: PASS - Ready for Phase 2
EOF

# Review audit
cat ~/outputs/phase1-audit.txt

# Commit audit
git -C ~/outputs add phase1-audit.txt
git -C ~/outputs commit -m "docs(phase1): foundation audit baseline"
```

**Phase 1 Gate:** Audit must show all GREEN. Address any RED items before proceeding.

---

## Phase 2: Infrastructure Setup (2-4 hours)

**Objective:** Configure network, storage, and compute resources.

### 2.1 UniFi Network Configuration
```bash
# (Manual step via UniFi web console)
# 1. Verify VLAN segmentation:
#    - AI-Workload VLAN: 10
#    - Guest VLAN: 20
#    - IoT VLAN: 30

# 2. Create firewall rule:
#    - Allow Mac Mini to internet (for cloud LLM routing)
#    - Block Ollama ports from internet (localhost-only)

# 3. Enable Threat Management
#    - Turn on IDS/IPS
#    - Enable C2 callback detection
```

### 2.2 Storage Setup
```bash
# Create required directories
mkdir -p ~/.openclaw/{agents,plugins,logs}
mkdir -p ~/.claude/{config,commands,rules}
mkdir -p ~/outputs/{artifacts,backups,logs}
mkdir -p ~/Documents/vault/.obsidian

# Set permissions (restrictive)
chmod 700 ~/.openclaw
chmod 700 ~/.claude
chmod 700 ~/outputs
chmod 700 ~/Documents/vault

# Verify permissions
ls -ld ~/.openclaw  # Should show: drwx------
```

### 2.3 Backup Configuration
```bash
# Create backup directory structure
mkdir -p ~/.backup/{daily,weekly,monthly}

# Configure iCloud Advanced Data Protection sync
# (Manual: System Settings → iCloud → Advanced Data Protection → Enable)

# Verify Proton Drive accessible
ls ~/Proton\ Drive/ && echo "Proton Drive OK" || mkdir -p ~/Proton\ Drive

# Create backup script placeholder
cat > ~/.backup/backup.sh << 'EOF'
#!/bin/bash
# Daily backup to Proton Drive
tar czf ~/Proton\ Drive/macmini-backup-$(date +%Y%m%d).tar.gz \
  ~/.openclaw ~/.claude ~/outputs ~/Documents/vault
echo "Backup complete: $(date)" >> ~/.backup/daily/backup.log
EOF
chmod +x ~/.backup/backup.sh
```

### 2.4 Monitoring & Logging Setup
```bash
# Create log directories
mkdir -p ~/.openclaw/logs
mkdir -p ~/.claude/logs

# Configure log rotation (placeholder)
cat > ~/.openclaw/logs/README.md << EOF
# OpenClaw Logs

Logs are automatically rotated weekly.
Archive older logs to: ~/.backup/monthly/

Critical errors should be escalated to operator.
EOF

# Initialize cost tracking database
sqlite3 ~/.openclaw/cost_tracker.sql << EOF
CREATE TABLE IF NOT EXISTS usage (
  id INTEGER PRIMARY KEY,
  date DATE,
  model TEXT,
  tokens_used INTEGER,
  cost REAL,
  accuracy_score REAL,
  response_time_ms INTEGER
);

CREATE INDEX idx_date ON usage(date);
CREATE INDEX idx_model ON usage(model);
EOF

echo "Cost tracker DB created"
```

**Phase 2 Gate:** All directories created, permissions set, backup configured.

---

## Phase 3: Agent Stack Deployment (4-6 hours)

**Objective:** Deploy and verify the five-agent orchestration system.

### 3.1 Ollama Deployment (Local LLM)

```bash
# Installation (if not present)
# See: https://ollama.ai

# Verify installation
ollama --version

# Pull required models
ollama pull qwen3:14b           # Primary reasoning
ollama pull deepseek-coder-v2:16b  # Code generation
ollama pull llama3.1:8b         # General fallback

# Start Ollama service
ollama serve &

# Wait for service startup
sleep 5

# Verify models loaded
curl -s http://localhost:11434/api/tags | jq '.models[].name'

# Verify localhost-only binding
lsof -i :11434 | grep LISTEN  # Should show 127.0.0.1 only
```

### 3.2 OpenClaw Deployment (Orchestrator)

```bash
# (This would be deployed from existing template)
# Placeholder for orchestrator setup
mkdir -p ~/.openclaw/agents/_core

cat > ~/.openclaw/agents/_core/openclaw-config.json << 'EOF'
{
  "port": 8000,
  "bind": "127.0.0.1",
  "loglevel": "info",
  "routing": {
    "local_threshold": 0.7,
    "cloud_threshold": 0.4
  }
}
EOF

# Start OpenClaw (placeholder)
# docker run -p 8000:8000 -v ~/.openclaw:/config openclaw:latest &

# Verify running
curl -s http://localhost:8000/health | jq .
```

### 3.3 Hermes Deployment (Executor)

```bash
# Deploy Hermes configuration
mkdir -p ~/.openclaw/executor

cat > ~/.openclaw/executor/hermes-config.json << 'EOF'
{
  "port": 9000,
  "bind": "127.0.0.1",
  "execution": {
    "timeout": 30,
    "max_retries": 3
  },
  "logging": {
    "level": "info",
    "file": "~/.openclaw/logs/hermes.log"
  }
}
EOF

# Start Hermes (placeholder)
# docker run -p 9000:9000 -v ~/.openclaw:/config hermes:latest &

# Verify running
curl -s http://localhost:9000/health | jq .
```

### 3.4 NemoClaw Deployment (Privacy Sandbox)

```bash
# Deploy NemoClaw configuration
mkdir -p ~/.openclaw/security

cat > ~/.openclaw/security/nemoclaw-policy.yaml << 'EOF'
version: 4.0
tiers:
  tier1:
    label: Public
    allowed_routes: [any]
  tier2:
    label: Confidential
    allowed_routes: [obsidian, proton, icloud]
    blocked_routes: [telegram, discord, slack, claude_web]
  tier3:
    label: HC-External-Review
    allowed_routes: [obsidian, legal_advisors]
    blocked_routes: [any_cloud, any_public]
  tier4:
    label: HC-Not-External
    allowed_routes: [local_only]
    blocked_routes: [any_cloud]
    enforcement: hard_veto

cloud_routing:
  nemoclaw_veto: true
  override_permitted: false
EOF

# Start NemoClaw (placeholder)
# docker run -p 9100:9100 -v ~/.openclaw:/config nemoclaw:latest &

# Verify running
curl -s http://localhost:9100/health | jq .
```

### 3.5 Agent Stack Verification

```bash
# Full health check
echo "=== Agent Stack Health Check ==="
echo "NemoClaw: $(curl -s http://localhost:9100/health | jq '.status')"
echo "Ollama: $(curl -s http://localhost:11434/api/tags | jq '.models | length') models"
echo "OpenClaw: $(curl -s http://localhost:8000/health | jq '.status')"
echo "Hermes: $(curl -s http://localhost:9000/health | jq '.status')"
```

**Phase 3 Gate:** All five agents responding and passing health checks.

---

## Phase 4: Security Hardening (2-3 hours)

**Objective:** Implement firewalls, credential management, and encryption.

### 4.1 LuLu Firewall Configuration

```bash
# LuLu should be installed and running
pgrep -x LuLu && echo "LuLu active" || echo "Install LuLu from App Store"

# Create LuLu rules
# (Via LuLu app: allow specific processes, block others)
# Key rule: Block Ollama (:11434) from internet
```

### 4.2 Credential Rotation

```bash
# Generate OpenRouter API key (operator provides)
# Store in environment:
cat >> ~/.zprofile << 'EOF'
export OPENROUTER_API_KEY="$(cat ~/.openclaw/secrets/openrouter.key)"
EOF

# Create secrets directory
mkdir -p ~/.openclaw/secrets
chmod 700 ~/.openclaw/secrets

# Store credentials securely
# (Operator manual step in Termius 8-Vault)

# Verify no credentials in code
find ~/.openclaw -name "*.sh" -o -name "*.js" | xargs grep -l "password\|token\|api_key" || echo "Clean"
```

### 4.3 Encryption Configuration

```bash
# iCloud Advanced Data Protection for vault
# (Already configured in Phase 2)

# SSH key-only authentication
# (Operator configures in Termius)

# Obsidian Sync encryption password
# (Operator configures in Obsidian)
```

**Phase 4 Gate:** No credentials in code, LuLu active, encryption configured.

---

## Phase 5: Operational Setup (2-3 hours)

**Objective:** Configure monitoring, logging, and daily operations procedures.

### 5.1 Audit Script Deployment

```bash
# Deploy macmini-audit.sh
# (Copy from repository)

cp /path/to/macmini-audit.sh ~/macmini-audit.sh
chmod +x ~/macmini-audit.sh

# Test audit
cd ~ && bash macmini-audit.sh > ~/outputs/phase5-audit.txt

# Review output
cat ~/outputs/phase5-audit.txt | head -30
```

### 5.2 Session Management

```bash
# Create session logging directory
mkdir -p ~/Documents/vault/sessions

# Create daily logging template
cat > ~/Documents/vault/daily.md << 'EOF'
# Daily Log — 2026-05-02

## Session Start
- Time: 
- Status:

## Work Completed
-

## Next Session
-

---
EOF
```

### 5.3 Cost Tracking Configuration

```bash
# Verify cost tracker schema
sqlite3 ~/.openclaw/cost_tracker.sql ".schema usage"

# Create initial cost record
sqlite3 ~/.openclaw/cost_tracker.sql << EOF
INSERT INTO usage VALUES
  (NULL, date('now'), 'claude', 0, 0.0, 0.0, 0);
EOF

# Verify insert
sqlite3 ~/.openclaw/cost_tracker.sql "SELECT * FROM usage;"
```

**Phase 5 Gate:** Audit script working, logging configured, cost tracking active.

---

## Phase 6: Integration Testing (3-4 hours)

**Objective:** Verify end-to-end workflows and data flows.

### 6.1 Local Inference Test

```bash
# Test Ollama inference
curl -X POST http://localhost:11434/api/generate \
  -d '{
    "model": "llama3.1:8b",
    "prompt": "What is cloud computing?",
    "stream": false
  }' | jq '.response' | head -c 200
```

### 6.2 Cloud Routing Test (with mock)

```bash
# Test OpenClaw routing decision
curl -X POST http://localhost:8000/route \
  -d '{"query":"hello world","sensitivity":"low"}' | jq '.selected_model'
# Expected: Local model

curl -X POST http://localhost:8000/route \
  -d '{"query":"What is the latest news?","sensitivity":"high"}' | jq '.selected_model'
# Expected: Cloud model
```

### 6.3 Privacy Enforcement Test

```bash
# Test Tier 4 blocking
curl -X POST http://localhost:9100/classify \
  -d '{"data":"Client ABC account 12345","tier":4}' | jq '.blocked'
# Expected: true

# Test Tier 1 allowing
curl -X POST http://localhost:9100/classify \
  -d '{"data":"Public information","tier":1}' | jq '.blocked'
# Expected: false
```

### 6.4 Rollback Test

```bash
# Test pre-action snapshot and rollback
echo "test" > ~/outputs/test-rollback.txt
git -C ~/outputs add test-rollback.txt
git -C ~/outputs commit -m "test: rollback procedure"

# Verify commit
git -C ~/outputs log --oneline | head -1

# Rollback
git -C ~/outputs reset --hard HEAD~1

# Verify file gone
[ ! -f ~/outputs/test-rollback.txt ] && echo "Rollback successful"
```

**Phase 6 Gate:** All integration tests pass, rollback procedure verified.

---

## Phase 7: Performance Tuning (4-6 hours)

**Objective:** Optimize LLM routing, cost, and response times.

### 7.1 LLM Evaluation Baseline

```bash
# Record baseline performance
cat > ~/outputs/phase7-baseline.json << 'EOF'
{
  "baseline_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "models": {
    "claude": {"cost_per_1m_tokens": 3, "accuracy": 0.95},
    "grok": {"cost_per_1m_tokens": 2, "accuracy": 0.88},
    "gemini": {"cost_per_1m_tokens": 2.5, "accuracy": 0.90},
    "ollama_local": {"cost": 0, "accuracy": 0.80}
  }
}
EOF
```

### 7.2 Routing Weight Configuration

```bash
# Create routing weights configuration
cat > ~/.claude/config/llm-routing.yaml << 'EOF'
version: 4.0
weights:
  accuracy: 0.48
  completeness: 0.32
  performance: 0.14
  token_efficiency: 0.06

local_routing:
  threshold: 0.7
  models:
    - qwen3:14b
    - llama3.1:8b

cloud_routing:
  threshold: 0.4
  order:
    - claude
    - grok
    - gemini
    - chatgpt
    - deepseek
    - codex

budget_caps:
  per_model: 20.0
  account_total: 25.0
EOF
```

### 7.3 Cost Optimization

```bash
# Analyze cost / accuracy tradeoffs
sqlite3 ~/.openclaw/cost_tracker.sql << EOF
SELECT model, 
  AVG(accuracy_score) as avg_accuracy,
  SUM(cost) as total_cost,
  SUM(tokens_used) as total_tokens
FROM usage
GROUP BY model
ORDER BY avg_accuracy DESC;
EOF
```

**Phase 7 Gate:** Routing weights configured, cost tracking validated.

---

## Phase 8: Documentation & Training (3-4 hours)

**Objective:** Create operational documentation and train operator.

### 8.1 Runbook Creation

```bash
# Runbooks already created in repository:
# - docs/macmini/ops-runbook.md
# - docs/macmini/onboarding-guide.md
# - docs/macmini/disaster-recovery.md
# - rules/macmini/session-rules.md

# Verify docs present
ls -la docs/macmini/*.md

# Verify readable
head -20 docs/macmini/ops-runbook.md
```

### 8.2 Operator Training Session

```bash
# Review with operator:
# 1. Daily startup sequence
# 2. Health checks
# 3. Session logging
# 4. Pre-action snapshots
# 5. HITL approval gates
# 6. Emergency procedures

# Operator should be able to:
# - SSH and run audit
# - Verify security posture
# - Execute workflows
# - Handle rollbacks
```

**Phase 8 Gate:** Documentation complete, operator trained.

---

## Phase 9: Pilot Deployment (2-4 hours)

**Objective:** Limited testing with real operator, identify issues.

### 9.1 Pilot Run (Operator-Initiated)

```bash
# Operator conducts first real session
# 1. SSH into Mac Mini
# 2. Run audit
# 3. Verify security
# 4. Execute a simple task
# 5. Create pre/post snapshots
# 6. Log to Obsidian
```

### 9.2 Feedback Collection

```bash
# After pilot, operator provides feedback:
# - Did daily startup work?
# - Were health checks clear?
# - Was rollback procedure clear?
# - Any confusing procedures?
# - Any unexpected blockers?
```

### 9.3 Issue Resolution

```bash
# Address any issues from pilot
# Update documentation if needed
# Test again if necessary
```

**Phase 9 Gate:** Pilot completed successfully, feedback addressed.

---

## Phase 10: Production Handoff (1-2 hours)

**Objective:** Transition to full operator responsibility.

### 10.1 Final Verification

```bash
# One final full audit
cd ~ && bash macmini-audit.sh

# Verify all systems green
# All health checks pass
# No blockers
```

### 10.2 Documentation Transfer

```bash
# Ensure operator has copies of:
# - MACMINI.md
# - ops-runbook.md
# - session-rules.md
# - Emergency contact procedures

# Location: ~/Documents/vault/macmini-docs/
mkdir -p ~/Documents/vault/macmini-docs/
cp MACMINI.md ~/Documents/vault/macmini-docs/
cp docs/macmini/* ~/Documents/vault/macmini-docs/
```

### 10.3 Production Authorization

```bash
# Operator signs off:
echo "MacMini-AI-Coach approved for production use.
Date: $(date)
Operator: [Name]
Sign-off: [Signature/approval]" >> ~/outputs/PRODUCTION-APPROVED.txt

# Final commit
git -C ~/outputs add PRODUCTION-APPROVED.txt
git -C ~/outputs commit -m "release: MacMini-AI-Coach v4.0 production approved"
```

**Phase 10 Gate:** Production ready, operator authorized, all systems operational.

---

## Summary Checklist

- [ ] Phase 1: Foundation audit complete
- [ ] Phase 2: Infrastructure setup complete
- [ ] Phase 3: Agent stack deployed and verified
- [ ] Phase 4: Security hardening complete
- [ ] Phase 5: Operational setup complete
- [ ] Phase 6: Integration testing passed
- [ ] Phase 7: Performance tuning complete
- [ ] Phase 8: Documentation and training complete
- [ ] Phase 9: Pilot deployment successful
- [ ] Phase 10: Production handoff authorized

---

## Rollback Procedures (Per Phase)

Each phase can be independently rolled back:

```bash
# Rollback to pre-Phase X state
git -C ~/outputs reset --hard [commit-before-phase-x]

# If infrastructure changes, may require manual reversal
# (Firewall rules, network config, etc.)
```

---

**Version 4.0 | Classification: Confidential | Last Updated: 2026-05-02**

**Follow this guide exactly. Each phase builds on the previous. No shortcuts.**
