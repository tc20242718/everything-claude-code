---
name: macmini-session-rules
description: Mandatory session governance and behavioral guidelines for MacMini-AI-Coach deployments
version: 4.0
source: MacMini handoff v3 (Sections 9, 13) + instructions v1 (Section 4)
lastUpdated: 2026-05-02
---

# MacMini Session Rules

All work within MacMini-AI-Coach deployments must adhere to these mandatory operating rules. **These are non-negotiable.** Sessions that violate these rules are terminated immediately.

---

## Session Identity

| Property | Value |
|----------|-------|
| Project | MacMini-AI-Coach |
| Operator Profile | 20+ years private banking / wealth management |
| Architecture | OpenClaw (8000) → Hermes (9000) → NemoClaw (9100) → Ollama (11434) |
| Risk Stance | Risk-first, capital-preservation discipline |
| Tone Required | Institutional, direct, no fluff |

---

## Mandatory Pre-Session Protocol

Execute in this exact sequence **every session** before any other action:

### Step 1: SSH Connection
```bash
# From iPhone via Termius (agents vault)
# Use Tailscale hostname, never direct IP
ssh <your-tailscale-hostname>

# Verify correct machine
sysctl -n machdep.cpu.brand_string    # Should show Apple M4
sw_vers                                # Confirm macOS version
```

### Step 2: Run Audit Script
```bash
cd ~ && bash macmini-audit.sh
```
- **Non-negotiable:** Run before any other action
- Paste full delta output into session
- Do not skip this step
- The delta IS your work queue

### Step 3: Verify Security Posture (Critical Blockers)
```bash
# NemoClaw responding
curl -s http://localhost:9100/health | grep -q "ok" && echo "NemoClaw OK" || echo "BLOCKER"

# Ollama localhost-only (must show 127.0.0.1, not 0.0.0.0)
lsof -i :11434 | grep LISTEN

# OpenClaw running
curl -s http://localhost:8000/health

# Hermes running
curl -s http://localhost:9000/health

# web-search plugin NOT loaded
ls ~/.openclaw/plugins/ | grep web-search && echo "BLOCKER: web-search present"

# LuLu active
/Applications/LuLu.app/Contents/MacOS/LuLu --status 2>/dev/null || pgrep -x LuLu
```
**Any FAIL = blocker. Do not proceed past blockers without operator decision.**

### Step 4: Cross-Reference Open Items
Compare audit delta against known blockers and open items. Identify critical blockers. Present to operator before proceeding.

### Step 5: Get Operator Approval
```
Present prioritized delta work queue:
- [CRITICAL] items blocking deployment
- [HIGH] items for operational stability
- [MED] items for feature completeness
- [LOW] items for optimization

Await explicit operator go-ahead before executing any work.
```

---

## Data Classification and Routing Rules

### Tier Definition

| Tier | Label | Permitted Channels | NOT Permitted | Enforcement |
|------|-------|---|---|---|
| 1 | Public | Any channel | None | Trust but verify |
| 2 | Confidential | Obsidian, Proton Drive, iCloud ADP | Telegram, Discord, Slack, Claude.ai web | Selective routing |
| 3 | HC-External-Review | Obsidian, legal/CPA advisors only | All cloud except approved advisors | NemoClaw screening |
| 4 | HC-Not-External | Local only | **ALL cloud surfaces** | NemoClaw hard block, zero exceptions |

### Hard Rules (Non-Negotiable)

**Tier 4 data NEVER transits:**
- Telegram
- Discord
- Slack
- Claude.ai (web)
- Any external cloud service

**If Tier 4 data touches cloud:** Session terminated immediately. Rollback all changes. Full forensic audit. Operator notification mandatory.

**NemoClaw Enforcement:**
- Acts as unoverridable veto
- No human override permitted
- Blocks Tier 3/4 routing to unauthorized cloud surfaces
- Hardware-enforced (not software flag)

**For Tier 3/4 Operations:**
- Execute within Claude Code on Mac Mini local harness
- Never on Claude.ai web interface
- All execution logged with timestamp and tier classification
- Operator sign-off logged before + after execution

---

## Pre-Action Snapshot Protocol

**Before any state-modifying operation (install, config change, agent update, credential rotation):**

### 1. Pre-Action Snapshot (Mandatory)
```bash
git add -A && git commit -m "pre-action snapshot: <clear description>"
```
- Captures current state
- Enables rollback if needed
- Provides audit trail

### 2. Document Rollback Procedure
Before executing, write down:
```
Rollback if needed: <exact command to restore previous state>
```

### 3. Execute the Work Item
- Follow documented procedure
- No ad-hoc changes
- Log execution in real-time

### 4. Verify Outcome
- Test critical paths
- Verify all systems operational
- Document any side effects

### 5. Post-Action Commit (Mandatory)
```bash
git add -A && git commit -m "complete: <item description> — <result summary>"
```

### 6. Log to Obsidian (Mandatory)
```
## $(date +%Y-%m-%dT%H:%M) — <item>
Result: <outcome>
Rollback: <command>
```

---

## HITL (Human-In-The-Loop) Approval Gates

**Require explicit operator go-ahead before executing:**

| Gate | Trigger | Approval Required |
|------|---------|---|
| **File Access** | Any Tier 3 or Tier 4 data file | Yes |
| **Agent Config** | OpenClaw routing, Hermes rules, NemoClaw policies | Yes |
| **Data Tier Assignment** | Assigning/reassigning data to Tier 3 or 4 | Yes |
| **Credential Rotation** | Updating SSH keys, API tokens, service accounts | Yes |
| **Infrastructure Changes** | UniFi, Tailscale, firewall, DNS, network config | Yes |
| **Privilege Escalation** | sudo commands, privilege grants | Yes |
| **Audit Skip** | Any attempt to skip audit protocol | Terminate immediately |

---

## Mandatory Operating Rules

### Tone and Format
- **Institutional, direct, risk-first** — No fluff, no pleasantries, no speculation
- **YAML frontmatter** on all documents — Required metadata
- **Tables and numbered steps** over prose narrative
- **Token target:** Under 800 unless expansion explicitly requested
- **All code:** arm64/M-series optimized — No x86 assumptions

### Pre-Action Discipline (Repeated for Emphasis)
1. **Pre-action snapshot** — Git commit captures state
2. **Rollback procedure documented** — Before executing
3. **Execute** — Followed by verification
4. **Post-action commit** — Captures outcome
5. **Log to Obsidian** — Timestamp, result, rollback command
6. **Operator notification** — Summary of work completed

### Never, Under Any Circumstance
- ✗ Hard-code credentials anywhere in any artifact
- ✗ Place Tier 4 data on any cloud surface
- ✗ Override NemoClaw privacy veto
- ✗ Skip audit protocol
- ✗ Enable openclaw-web-search plugin before remediation confirmed
- ✗ Assume fresh install state (audit always defines reality)
- ✗ Make unilateral data tier assignments
- ✗ Execute state-modifying operations without pre-action snapshot

---

## Skill Output Rules

### Skills with NO COLON formatting rule
- **QuantumShield:** Zero-trust threat scanning
- **TruthEngine:** Feedback generation
- **GrokSkills:** Architecture analysis

Output format: No colons (`:`) anywhere in output. Use hyphens, em-dashes, or parentheses instead.

### All Other Skills
Standard markdown format permitted.

---

## Security Non-Negotiables

### Credentials and Secrets
- No API keys, passwords, tokens in any file
- Use placeholders: `${GITHUB_TOKEN}`, `${API_KEY}`, etc.
- Operator manages secrets in local environment only

### PII and Sensitive Data
- Client names → Client_A, Client_B, etc.
- Account numbers → Account_XXX
- Positions → Position_N
- Redact unless operationally essential
- When redacted, use consistent placeholders

### External Dependencies
- Explicitly flag all MCP, API, third-party integrations
- Document required permissions
- Verify no egress of sensitive data

### Obsidian Plugin Lockdown
- Only vetted plugins approved:
  - Templater
  - Dataview
  - Calendar
  - Periodic Notes
- **No plugins requesting network access without explicit review**
- Unapproved plugins = blocker, session terminated

---

## Eight Architectural Principles (Mandatory)

1. **Cybersecurity is the top-level design constraint.** Every decision subordinates to it.
2. **Local-first by default.** Cloud routing requires explicit justification; NemoClaw enforces.
3. **Privacy veto is non-negotiable.** Data tier determines routing. Zero overrides.
4. **Audit before prescribe.** Never assume fresh state. Cross-reference existing environment before adding work.
5. **Skill as system.** The master skill is the single source of truth. Eliminates instruction drift across sessions.
6. **Backup before any install, upgrade, or swap.** No exceptions.
7. **Token persistence is architectural debt.** Solve structurally (AES-256-CBC), not repeatedly session by session.
8. **Institutional rigor applied to AI.** Capital preservation, rollback discipline, and HITL gates from wealth management translate directly to AI infrastructure governance.

---

## Quick Reference: Health Check Commands

**Run these every session after audit:**

```bash
# NemoClaw
curl -s http://localhost:9100/health

# Ollama
curl -s http://localhost:11434/api/tags

# OpenClaw
curl -s http://localhost:8000/health

# Hermes
curl -s http://localhost:9000/health

# LuLu (Mac firewall)
/Applications/LuLu.app/Contents/MacOS/LuLu --status 2>/dev/null || pgrep -x LuLu

# ClamAV status
launchctl list | grep clamav || echo "ClamAV not running"
```

**All health checks must PASS before proceeding. Any FAIL = blocker.**

---

## Session Termination Triggers

Session is **immediately terminated** if:

1. Tier 4 data appears on any cloud surface
2. Audit protocol skipped or bypassed
3. NemoClaw veto overridden by operator
4. Hard-coded credentials discovered in any artifact
5. HITL approval gate violated without operator sign-off
6. Operator directly refuses to approve a work item

**Upon termination:**
- All uncommitted changes discarded
- Rollback to last known good state
- Full forensic audit log generated
- Operator notification with detailed findings

---

## Session Handoff (Agent-to-Agent Continuity)

When handing off between agents or sessions:

1. **Commit all work** with descriptive message
2. **Create session summary** in Obsidian with:
   - Timestamp of handoff
   - Work completed this session
   - Open items for next session
   - Any blockers or warnings
3. **Verify security posture** before handoff
4. **Paste session context** into next agent's initial prompt
5. **Next agent runs audit** to verify continuity

---

## Audit Delta as Work Queue

The macmini-audit.sh output **IS your work queue.** Do not create additional work items outside the audit delta without operator approval.

**Audit delta contains:**
- System state verification
- Missing components
- Configuration drifts
- Security posture changes
- Identified blockers

**Respond to audit delta, in priority order:**
1. CRITICAL (blocking deployment)
2. HIGH (operational stability)
3. MEDIUM (feature completeness)
4. LOW (optimization)

---

**Version 4.0 | Classification: Confidential | Last Updated: 2026-05-02**

**These rules are non-negotiable. Violation = session termination.**
