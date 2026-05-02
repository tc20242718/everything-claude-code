---
name: macmini-ai-coach
description: Domain expertise for MacMini-AI-Coach deployment, operations, and enterprise governance
version: 4.0
source: MacMini handoff v3 + instructions v1
lastUpdated: 2026-05-02
---

# MacMini AI Coach Skill

Comprehensive domain knowledge for deploying, operating, and governing MacMini-AI-Coach — an enterprise-grade personal AI development environment combining local-first inference (Ollama) with selective cloud routing (Claude, Grok, Gemini, etc.) under strict privacy enforcement (NemoClaw).

---

## When to Use This Skill

Use the MacMini AI Coach skill when:

- **Deploying or initializing** MacMini-AI-Coach environment
- **Operating** the system day-to-day (startup, health checks, troubleshooting)
- **Making architectural decisions** affecting agent stack, LLM routing, or privacy enforcement
- **Responding to audit findings** and resolving identified blockers
- **Rotating credentials** or updating security configurations
- **Managing data tiers** and enforcing privacy classification rules
- **Handling incidents** (data breaches, failed components, credential compromise)
- **Planning major changes** (hardware upgrades, agent updates, MCP integration)
- **Documenting patterns** and establishing operational discipline

Do NOT use this skill for:
- General Claude API questions (use other skills)
- Non-MacMini AI development workflows
- Tasks that don't involve the five-agent orchestration stack
- Operations outside the wealth-management discipline framework

---

## How It Works

### 1. Architecture and Stack

MacMini-AI-Coach is a **five-tier orchestration system** running on Apple Silicon (M4 Pro):

```
[iPhone/Termius Operator]
    ↓
[OpenClaw :8000] — Router, Sensitivity Classifier
    ↓
[Hermes :9000] — Executor, Versioning, Rollback
    ↓
[NemoClaw :9100] — Privacy Sandbox, 4-Tier Data Classifier, Cloud Routing Veto
    ↓
[Ollama :11434] — Local LLM inference (arm64 optimized)
↓
[Claude, Grok, Gemini, ChatGPT, DeepSeek, Codex] — Cloud fallback (via OpenRouter)
```

**Core Design Principle:** Cybersecurity first → Privacy enforcement → Local-first → Cost efficiency

### 2. Data Classification and Privacy Enforcement

Four tiers control where data can be routed:

| Tier | Risk | Routing Allowed | Routing Blocked |
|------|------|---|---|
| **1: Public** | Low | Any channel | None |
| **2: Confidential** | Medium | Obsidian, Proton Drive, iCloud ADP | Telegram, Discord, Slack, web |
| **3: HC-External-Review** | High | Obsidian, Legal/CPA advisors | Most cloud services |
| **4: HC-Not-External** | Critical | Local only | ALL cloud surfaces (NemoClaw hard block) |

**Non-Negotiable:** Tier 4 data (client names, accounts, positions, PII) NEVER transits any cloud surface under any circumstance. NemoClaw enforces this as unoverridable veto.

### 3. Multi-LLM Routing and Cost Control

Six LLMs routed via OpenRouter with strict budget controls:

```
Routing Weights:
- Accuracy: 48%
- Completeness: 32%
- Performance: 14%
- Token Efficiency: 6%

Per-LLM monthly cap: $20 (auto-switch on hit)
Account-level ceiling: $25/month (hard limit)

Local routing (~90% of traffic): Ollama (free)
Cloud routing (~10%): Claude > Grok > Gemini > ChatGPT > DeepSeek > Codex
```

### 4. Five Custom Skills (Built on MacMini Stack)

| Skill | Function | Cloud Order |
|-------|----------|---|
| **QuantumShield** | Threat scanning, PQC, steganography | Grok > Claude |
| **TruthEngine** | Feedback modes (Socratic, Carrey, Gervais, etc.) | Claude > Grok > ChatGPT |
| **DeepResearch** | 5+ source triangulation, adversarial review | Gemini > Claude > Grok |
| **HonestFriend** | Direct accountability feedback | Claude > Grok |
| **GrokSkills** | Architecture analysis, versioning, rollback | Claude > Grok > Gemini |

### 5. Session Startup Protocol

**Every session starts with this exact sequence:**

```bash
# 1. SSH via Tailscale (never direct IP)
ssh <tailscale-hostname>

# 2. Run audit (non-destructive verification)
cd ~ && bash macmini-audit.sh

# 3. Health check all agents (all must pass or BLOCKER)
curl http://localhost:9100/health    # NemoClaw
curl http://localhost:11434/api/tags # Ollama
curl http://localhost:8000/health    # OpenClaw
curl http://localhost:9000/health    # Hermes

# 4. Verify security posture
# - web-search plugin disabled
# - LuLu firewall active
# - Ollama localhost-only

# 5. Get operator approval on audit delta

# 6. Execute work with pre-action snapshot discipline
```

### 6. Pre-Action Snapshot Discipline

Before any state-modifying operation:

```bash
# 1. Pre-snapshot
git add -A && git commit -m "pre-action snapshot: <description>"

# 2. Document rollback
echo "Rollback: <exact command>" >> notes

# 3. Execute work

# 4. Verify outcome

# 5. Post-action commit
git add -A && git commit -m "complete: <item> — <result>"

# 6. Log to Obsidian
echo "## $(date +%Y-%m-%dT%H:%M) — <item>" >> ~/Documents/vault/daily.md
```

### 7. HITL (Human-In-The-Loop) Approval Gates

**Require explicit operator approval before:**
- File access (Tier 3/4 data)
- Agent config changes
- Credential rotation
- Infrastructure changes (UniFi, Tailscale, firewall)
- Any data tier assignment

### 8. Network Architecture

**Zero-trust remote access (Tailscale) + hardened local network (UniFi):**

- **Physical:** Wired Ethernet via UniFi Dream Machine
- **Network:** VLAN segmentation (AI workload isolated from guest/IoT)
- **Remote:** Tailscale SSH tunneling (no direct port exposure)
- **SSH Client:** Termius 8-Vault (operational segmentation)
- **Outbound Firewall:** LuLu (per-process; Ollama blocked from internet)
- **Packet Filter:** pf (hardened)
- **Malware:** ClamAV daily scan (3 AM)
- **IDS/IPS:** UniFi Threat Management (C2 detection active)

### 9. Eight Architectural Principles

1. **Cybersecurity first** — Top-level design constraint
2. **Local-first by default** — Cloud routing requires explicit justification
3. **Privacy veto non-negotiable** — Data tier determines routing
4. **Audit before prescribe** — Never assume fresh state
5. **Skill as system** — Master skill is single source of truth
6. **Backup before any change** — No exceptions
7. **Token persistence architectural debt** — Solve structurally (AES-256-CBC)
8. **Institutional rigor applied to AI** — Capital preservation discipline

---

## Examples and Workflows

### Example 1: Daily Startup

```bash
# SSH in
ssh macmini.tailscale

# Run audit
cd ~ && bash macmini-audit.sh

# Output shows:
# - NemoClaw responding ✓
# - Ollama running with 3 models ✓
# - OpenClaw ready ✓
# - web-search disabled ✓
# - 2 HIGH-priority items in delta (new LLM routing config, ClamAV backup)

# Present to operator:
# "Audit clean. Two HIGH items identified:
#  1. Update LLM routing weights (weekly evaluation)
#  2. Verify ClamAV backup completed
#  Ready to proceed on your approval."

# Upon approval:
git add -A && git commit -m "pre-action: weekly LLM routing evaluation"
# (Execute routing weight updates)
git add -A && git commit -m "complete: LLM routing weights updated — Accuracy +2%, Cost -3%"
```

### Example 2: Responding to Data Classification Change

**Scenario:** Operator wants to move a dataset from Tier 2 to Tier 4 (client data).

```bash
# 1. Get HITL approval
# "This file contains client account numbers. 
#  Tier 4 classification means it can NEVER be cloud-routed. 
#  Are you certain? Yes / No"

# 2. If yes, pre-action snapshot
git add -A && git commit -m "pre-action snapshot: tier-4 classification for client-accounts.csv"

# 3. Update data classification marker
# (Add Tier 4 label to file metadata or config)

# 4. Verify NemoClaw recognizes classification
curl -X POST http://localhost:9100/classify \
  -d '{"file":"client-accounts.csv"}' | jq .

# 5. Post-action
git add -A && git commit -m "complete: client-accounts.csv classified as Tier 4 — no cloud routing"

# 6. Obsidian log
# "## 2026-05-02T14:30 — Tier 4 Classification
#  File: client-accounts.csv
#  Enforcement: NemoClaw hard-blocked from cloud routing
#  Rollback: git reset --hard <commit>"
```

### Example 3: Emergency Shutdown (Data Breach Suspected)

**Scenario:** Tier 4 data might have been routed to cloud (e.g., web-search plugin accidentally enabled).

```bash
# 1. STOP immediately
# Do not execute any further queries

# 2. Disable web-search
rm -rf ~/.openclaw/plugins/openclaw-web-search
curl -X POST http://localhost:8000/reload

# 3. Verify disabled
ls ~/.openclaw/plugins/ | grep web-search  # Should return nothing

# 4. Forensic audit
# Check logs for any cloud-routed queries
grep -r "web-search\|SerpAPI\|Brave\|Bing" ~/.openclaw/logs/

# 5. If queries found, escalate to operator immediately with:
# - Timeline of compromise
# - Which LLM(s) involved
# - Estimated data exposure
# - Recommended remediation (credential rotation, etc.)

# 6. Operator decision on rollback depth
```

### Example 4: LLM Budget Exhaustion

**Scenario:** Claude API spend hits $20/month cap for the month.

```bash
# 1. Detect via monitoring
sqlite3 ~/.openclaw/cost_tracker.sql \
  "SELECT SUM(cost) FROM usage WHERE model='claude' AND month='2026-05'"
# Output: 20.12 (over cap)

# 2. OpenClaw auto-routes to next best (Grok)
# (No manual intervention needed)

# 3. Notify operator
echo "Claude monthly cap hit. Routing switched to Grok > Gemini > ChatGPT"

# 4. Operator options:
# - Wait for next month (cap resets)
# - Increase budget cap (rare)
# - Switch to local-only routing (Ollama)

# 5. Verify fallback working
# All Claude requests should now route to next tier
```

### Example 5: SSH Key Rotation (Credential Compromise)

```bash
# 1. Pre-action snapshot
git add -A && git commit -m "pre-action: SSH key rotation (compromise detected)"

# 2. Generate new SSH key
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_new -C "macmini@$(date +%Y%m%d)"

# 3. Add new public key to authorized_keys
cat ~/.ssh/id_ed25519_new.pub >> ~/.ssh/authorized_keys

# 4. Update Termius vault with new private key
# (Manual step in Termius app)

# 5. Verify new key works
ssh -i ~/.ssh/id_ed25519_new macmini.tailscale "echo OK"

# 6. Remove old private key
rm ~/.ssh/id_ed25519  # (or rename to .bak for audit trail)

# 7. Post-action
git add -A && git commit -m "complete: SSH key rotated (new ed25519 key active)"

# 8. Obsidian audit log
echo "## SSH Key Rotation
    Date: $(date)
    Old key: id_ed25519
    New key: id_ed25519_new
    Reason: Compromise detection
    Rollback: Revert to old key if new key fails" >> ~/Documents/vault/security-audit.md
```

---

## Troubleshooting Quick Reference

| Issue | Command | Expected Result |
|-------|---------|---|
| NemoClaw down | `curl http://localhost:9100/health` | `{"status":"ok"}` |
| Ollama models missing | `curl http://localhost:11434/api/tags` | 3+ models listed |
| API spend over budget | `sqlite3 ... SELECT SUM(cost) FROM usage` | Under $20 (per-LLM) |
| web-search enabled | `ls ~/.openclaw/plugins/` | No web-search entry |
| Tierdata on cloud | `grep "tier.*4" ~/.openclaw/logs/` | No matches |

---

## Integration with Everything-Claude-Code

This skill integrates with the broader ECC agent ecosystem:

- **Agents:** Delegates to existing ECC agents (code-reviewer, architect, tdd-guide)
- **Commands:** `/macmini-audit` command invokes audit script
- **Skills:** Works alongside 150+ existing ECC skills
- **Rules:** Respects language-specific and common rules in `/rules/`
- **Tests:** Follows ECC testing patterns in `node tests/`

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `agents/macmini-ai-coach.md` | Master agent definition |
| `rules/macmini/session-rules.md` | Session governance |
| `docs/macmini/ops-runbook.md` | Daily operations |
| `MACMINI.md` | Root navigation hub |
| `mcp-configs/macmini-mcp-servers.json` | MCP server config |
| `scripts/macmini/audit.js` | Audit script (Node.js) |

---

## Output Format Rules

**QuantumShield, TruthEngine, GrokSkills:** NO COLONS in output. Use hyphens or em-dashes instead.

Example:
```
✓ Correct:   Policy — allows local routing with cloud fallback
✗ Incorrect: Policy: allows local routing with cloud fallback
```

All other skills: Standard markdown permitted.

---

**Version 4.0 | Classification: Confidential | Last Updated: 2026-05-02**

For more information, see `MACMINI.md` or `docs/macmini/ops-runbook.md`.
