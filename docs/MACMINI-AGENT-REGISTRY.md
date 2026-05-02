---
title: MacMini-AI-Coach Agent Registry
version: 4.0
date: 2026-05-02
classification: Confidential
---

# MacMini-AI-Coach Agent Registry

**Agent discovery, capabilities, and integration documentation for MacMini-AI-Coach within everything-claude-code harness.**

---

## Agent Registration

**Agent Name:** macmini-ai-coach  
**Version:** 4.0  
**Status:** Production (PASS-with-conditions, QA: 2026-04-26)  
**Scope:** Enterprise-grade personal AI development environment on Apple Silicon  
**Classification:** Confidential  

---

## Agent Metadata

| Property | Value |
|----------|-------|
| **Primary Model** | claude-opus-4-6 (with claude-sonnet-4-6 fallback) |
| **Supported Platforms** | macOS (Apple Silicon M-series) |
| **Architecture** | arm64-optimized, no x86 |
| **Integration** | everything-claude-code harness v1.9.0+ |
| **Tools Required** | Bash, Read, Write, Grep, Glob |
| **Dependencies** | Ollama, OpenRouter API |

---

## Capabilities

### Core Domains

1. **Deployment & Infrastructure**
   - 10-phase systematic deployment procedure
   - Hardware verification and setup
   - Network hardening (UniFi, Tailscale, LuLu)
   - MCP server orchestration

2. **Operations & Maintenance**
   - Daily startup verification
   - Health checks and diagnostics
   - Troubleshooting runbooks
   - Disaster recovery and backup

3. **Security & Governance**
   - Data classification (4-tier enforcement)
   - Privacy policy enforcement (NemoClaw)
   - Credential management and rotation
   - Incident response procedures

4. **Training & Onboarding**
   - New operator training (5-step protocol)
   - SSH configuration and verification
   - Session management procedures
   - Best practices documentation

5. **Development & Integration**
   - Claude Code guardrails (data tier enforcement)
   - Session continuity and context management
   - Pre-action snapshot discipline
   - HITL approval gate implementation

---

## Files in Agent

### Documentation (8 files)

**Root & Navigation:**
- `MACMINI.md` — Master navigation hub and quick reference

**Agent Definition:**
- `agents/macmini-ai-coach.md` — Complete agent specification

**Operational Procedures (4 files):**
- `docs/macmini/ops-runbook.md` — Daily operations, health checks, troubleshooting
- `docs/macmini/onboarding-guide.md` — New operator training (8 parts)
- `docs/macmini/ssh-verification.md` — SSH key setup and security
- `docs/macmini/disaster-recovery.md` — Backup and recovery procedures

**Security & Governance (2 files):**
- `rules/macmini/session-rules.md` — Mandatory session protocols
- `rules/macmini/security-compliance.md` — Data tiers, PII redaction, audit

### Skills & Procedures (4 files)

- `skills/macmini-ai-coach/SKILL.md` — Skill manifest and how-it-works
- `skills/macmini-ai-coach/macmini-context-handoff.md` — Session continuity
- `skills/macmini-ai-coach/macmini-deployment-checklist.md` — Pre-deployment QA
- `skills/macmini-ai-coach/macmini-enterprise-build.md` — 10-phase build guide

### Configuration & Automation (3 files)

- `scripts/macmini/audit.js` — Cross-platform Node.js audit script
- `mcp-configs/macmini-mcp-servers.json` — MCP server configuration
- `agent.yaml` — Agent registry and skill manifest (updated)

### Claude Code Integration (2 files)

- `.claude/rules/macmini-guardrails.md` — Data tier guardrails, HITL gates
- `.claude/commands/macmini-setup.md` — `/macmini-setup` slash command

**Total: 19 comprehensive files covering all aspects of MacMini-AI-Coach**

---

## Quick Start

### For New Operators

1. Read `MACMINI.md` (5 minutes)
2. Study `agents/macmini-ai-coach.md` (15 minutes)
3. Review `rules/macmini/session-rules.md` (15 minutes)
4. Complete `docs/macmini/onboarding-guide.md` (1-2 hours)
5. Run `/macmini-setup` before first session

### For Developers

1. Review `skills/macmini-ai-coach/SKILL.md` (architecture)
2. Study `mcp-configs/macmini-mcp-servers.json` (routing logic)
3. Reference `.claude/rules/macmini-guardrails.md` (integration points)
4. Check `scripts/macmini/audit.js` (implementation patterns)

### For System Administrators

1. Study `skills/macmini-ai-coach/macmini-enterprise-build.md` (10 phases)
2. Review `docs/macmini/disaster-recovery.md` (backup strategy)
3. Implement `docs/macmini/ssh-verification.md` (security setup)
4. Configure `mcp-configs/macmini-mcp-servers.json` (agent stack)

---

## Agent Architecture

```
┌─────────────────────────────────────┐
│      Operator (iPhone/Termius)      │
└──────────────┬──────────────────────┘
               │
        Tailscale Tunnel
               │
┌──────────────▼──────────────────────┐
│   Claude Code (Mac Mini harness)    │
│  /macmini-setup (initialization)    │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
OpenClaw    Hermes   NemoClaw
 :8000      :9000    :9100 ← CRITICAL: Privacy enforcement
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
 Ollama              Cloud LLMs
:11434              (OpenRouter)
(Local,           Claude, Grok,
 Free)            Gemini, etc.
```

---

## Key Differentiators

### 1. Tier 4 Data Hard Block
- NemoClaw enforces unoverridable veto
- Client data NEVER on cloud surfaces
- Compliance by design, not configuration

### 2. Operational Discipline
- Pre-action snapshots (git) before every change
- HITL approval gates for sensitive operations
- Rollback capability for every state

### 3. Local-First with Cloud Fallback
- ~90% queries on local Ollama (free)
- Cloud routing only when justified
- Cost control: $20/LLM cap, $25/account cap

### 4. Institutional Rigor
- Architecture from wealth management principles
- Capital preservation, auditability, rollback discipline
- Risk-first decision making

### 5. Cross-Platform Scripts
- Node.js (not bash) for portability
- M-series optimized (no x86 assumptions)
- Windows/macOS/Linux compatible

---

## Integration Points

### With Everything-Claude-Code

- **Agent framework:** Registered in `agent.yaml`
- **Skills system:** Follows ECC skill format and naming conventions
- **Commands:** `/macmini-setup` slash command
- **Rules:** YAML frontmatter, proper file structure
- **Testing:** Node.js test patterns (future)

### With MacMini Infrastructure

- **OpenClaw** — Orchestrator (port 8000)
- **Hermes** — Executor (port 9000)
- **NemoClaw** — Privacy sandbox (port 9100)
- **Ollama** — Local LLM inference (port 11434)
- **Git** — Commit history and rollback
- **Obsidian** — Session logging and continuity

### With Claude Code Harness

- **Session guardrails** — Data tier enforcement
- **Startup command** — Automatic verification
- **Context management** — Session continuity procedures
- **HITL gates** — Approval requirement enforcement

---

## Usage Patterns

### Pattern 1: Daily Operations

```
1. /macmini-setup (automatic verification)
2. Review audit delta (work queue)
3. Get operator approval
4. Execute with pre-action snapshots
5. Log to Obsidian
6. Final git commit
7. /clear (session end)
```

### Pattern 2: Configuration Changes

```
1. Pre-action snapshot: git commit "pre-action: [description]"
2. Document rollback: [exact command]
3. Get HITL approval (if applicable)
4. Execute change
5. Verify outcome
6. Post-action: git commit "complete: [result]"
7. Log to Obsidian with rollback trail
```

### Pattern 3: Emergency Incident

```
1. STOP all operations
2. Preserve evidence (logs, state)
3. Document incident with timeline
4. Escalate to operator
5. Follow disaster recovery procedures
6. Full forensic audit post-incident
```

---

## Success Metrics

**Agent should be considered successful when:**

- ✓ All 19 artifacts present and accurate
- ✓ Operator can run `/macmini-setup` with clean output
- ✓ Daily startup protocol consistently passes
- ✓ Zero Tier 4 data leaks to cloud surfaces
- ✓ All sessions logged to Obsidian with full audit trail
- ✓ Monthly compliance audit passes
- ✓ Disaster recovery tested and verified working
- ✓ Team members trained and confident
- ✓ Cost spending stays under $25/month budget
- ✓ Incident response procedures proven in drills

---

## Support & Maintenance

### Documentation Updates
- Follow conventional commit format
- Update version number in frontmatter
- Always maintain YAML frontmatter
- Keep no PII or credentials in files

### Capability Extensions
- New skills added to `skills/macmini-ai-coach/` directory
- New commands added to `.claude/commands/macmini-*`
- New rules added to `rules/macmini/`
- Update `agent.yaml` to register new items

### Community & Contributions
- Security reviews required for all changes
- HITL approval for policy modifications
- Operator sign-off for operational changes
- Git history maintained for auditability

---

## Links & Resources

| Resource | Location | Purpose |
|----------|----------|---------|
| Master Agent | `agents/macmini-ai-coach.md` | Complete specification |
| Navigation | `MACMINI.md` | Quick reference hub |
| Onboarding | `docs/macmini/onboarding-guide.md` | Training for operators |
| Operations | `docs/macmini/ops-runbook.md` | Daily procedures |
| Security | `rules/macmini/security-compliance.md` | Compliance rules |
| Deployment | `skills/macmini-ai-coach/macmini-enterprise-build.md` | 10-phase build |
| Disaster | `docs/macmini/disaster-recovery.md` | Backup & recovery |
| Setup | `.claude/commands/macmini-setup.md` | Slash command |
| Guardrails | `.claude/rules/macmini-guardrails.md` | Claude Code rules |

---

**Version 4.0 | Classification: Confidential | Last Updated: 2026-05-02**

**MacMini-AI-Coach is fully integrated, documented, and ready for production deployment.**
