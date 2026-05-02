---
title: MacMini-AI-Coach Documentation Hub
version: 4.0
date: 2026-05-02
classification: Confidential
---

# MacMini-AI-Coach

**Enterprise-grade personal AI development environment on Apple Silicon.**

An integrated orchestration system for secure, auditable AI inference combining local-first processing (Ollama) with selective cloud routing (Claude, Grok, Gemini, ChatGPT, DeepSeek, Codex) under strict privacy enforcement (NemoClaw).

---

## Quick Status

| Item | Status | Notes |
|------|--------|-------|
| QA Verdict | PASS-with-conditions | Audit completed 2026-04-26 |
| Deployment | In Progress | Phases 1-10 pending audit delta |
| Critical Blockers | 3 items | Ops runbook, onboarding, SSH verification |
| Security Posture | Protected | NemoClaw active, web-search disabled, LuLu enforced |

---

## Architecture Overview

**Five-tier agent stack** orchestrating secure, cost-controlled AI inference:

```
[iPhone Operator / Termius / Apple Shortcuts]
         ↓
[OpenClaw] :8000 (Orchestrator / Sensitivity Classifier)
         ↓
[Hermes] :9000 (Executor / Versioning / Rollback)
         ↓
[NemoClaw] :9100 (Privacy Sandbox / 4-Tier Enforcer / Cloud Veto)
         ↓
[Ollama] :11434 (Local-first LLM inference)
[Claude / Grok / Gemini / ChatGPT / DeepSeek / Codex] (Cloud fallback)
```

**Core Design:** Cybersecurity first → Privacy enforcement → Local-first inference → Cost efficiency

---

## Documentation Map

### Operational Runbooks
- **[Ops Runbook](docs/macmini/ops-runbook.md)** — Daily operations, health checks, troubleshooting
- **[Session Rules](rules/macmini/session-rules.md)** — Mandatory operating procedures and session startup protocol
- **[Onboarding Guide](docs/macmini/onboarding-guide.md)** — New operator training (SSH setup, environment validation)
- **[SSH Verification](docs/macmini/ssh-verification.md)** — SSH configuration and security procedures
- **[Disaster Recovery](docs/macmini/disaster-recovery.md)** — Backup, restoration, rollback procedures

### Design & Architecture
- **[Master Agent](agents/macmini-ai-coach.md)** — System architecture, agent stack, multi-LLM routing
- **[Skill Framework](skills/macmini-ai-coach/SKILL.md)** — Core responsibilities and workflow patterns
- **[Enterprise Build Guide](skills/macmini-ai-coach/macmini-enterprise-build.md)** — 10-phase deployment procedures
- **[Deployment Checklist](skills/macmini-ai-coach/macmini-deployment-checklist.md)** — Pre-deployment QA and validation
- **[Context Handoff](skills/macmini-ai-coach/macmini-context-handoff.md)** — Session continuity and state management

### Security & Compliance
- **[Security Compliance Rules](rules/macmini/security-compliance.md)** — Data classification, privacy enforcement, tier routing
- **[Session Guardrails](.claude/rules/macmini-guardrails.md)** — Claude Code specific behaviors and safeguards

### Commands & Automation
- **[Audit Command](commands/macmini-audit.md)** — Environment verification workflow
- **[Audit Script](scripts/macmini/audit.js)** — Non-destructive environment verification (cross-platform Node.js)

### Configuration
- **[MCP Servers](mcp-configs/macmini-mcp-servers.json)** — MCP server configuration and routing

---

## Five Custom Skills

| Skill | Primary Function | Cloud Order | Output Format |
|-------|------------------|-------------|---|
| **QuantumShield** | Threat scanning, steganography detection, PQC | Grok > Claude | No colons |
| **TruthEngine** | Feedback modes (Gervais/Carrey/Socratic/Therapeutic) | Claude > Grok > ChatGPT | No colons |
| **DeepResearch** | Multi-source triangulation, adversarial review | Gemini > Claude > Grok | Standard |
| **HonestFriend** | Direct accountability feedback | Claude > Grok | Standard |
| **GrokSkills** | Wealth management, AI architecture, versioning | Claude > Grok > Gemini | No colons |

---

## Data Classification & Privacy

| Tier | Label | Routing Rule | Risk Level |
|------|-------|--------------|-----------|
| 1 | Public | Any channel | Low |
| 2 | Confidential | Obsidian + Proton + iCloud ADP | Medium |
| 3 | HC-External-Review | Obsidian + legal/CPA only | High |
| 4 | HC-Not-External | Local only (NemoClaw hard block) | Critical |

**Mandatory Rule:** Tier 4 data (client names, accounts, positions, PII) **NEVER** on any cloud surface.

---

## Hardware Baseline

| Component | Specification |
|-----------|---|
| Chip | Apple M4 Pro |
| Memory | 24 GB unified |
| Storage | 512 GB+ SSD |
| Network | Wired Ethernet (UniFi Dream Machine) |
| Architecture | arm64 — M-series optimized |

---

## Session Startup Checklist

**BEFORE ANY WORK:**

1. ✓ SSH into Mac Mini via Tailscale (Termius)
2. ✓ Run audit: `cd ~ && bash macmini-audit.sh`
3. ✓ Paste delta report into session
4. ✓ Verify NemoClaw responding: `curl -s http://localhost:9100/health`
5. ✓ Verify Ollama running: `curl -s http://localhost:11434/api/tags`
6. ✓ Verify OpenClaw running: `curl -s http://localhost:8000/health`
7. ✓ Confirm web-search plugin DISABLED: `ls ~/.openclaw/plugins/ | grep web-search`
8. ✓ Get operator approval before proceeding to work items

---

## Key Paths

| Resource | Path |
|----------|------|
| Master Agent | `agents/macmini-ai-coach.md` |
| Session Rules | `rules/macmini/session-rules.md` |
| Ops Runbook | `docs/macmini/ops-runbook.md` |
| Security Rules | `rules/macmini/security-compliance.md` |
| Audit Script | `scripts/macmini/audit.js` |
| MCP Config | `mcp-configs/macmini-mcp-servers.json` |
| Master Artifacts | `~/outputs/` (external) |
| Obsidian Vault | `~/Documents/vault/` (external) |

---

## Mandatory Operating Rules

**Institutional tone required at all times.**

### Pre-Action Discipline
```bash
# 1. Pre-action snapshot
git add -A && git commit -m "pre-action snapshot: <description>"

# 2. Document rollback command
echo "Rollback: <command>" >> notes.txt

# 3. Execute work

# 4. Verify outcome

# 5. Post-action commit
git add -A && git commit -m "complete: <item> — <result>"

# 6. Log to Obsidian
echo "## $(date +%Y-%m-%dT%H:%M) — <item>\nResult: <outcome>\nRollback: <command>" >> ~/Documents/vault/daily.md
```

### HITL Approval Gates
Require explicit operator go-ahead before:
- File access (Tier 3/4 data)
- Agent configuration changes
- Any UniFi, Tailscale, or credential modification
- Data tier reassignment

### Security Non-Negotiables
- ✗ No hard-coded credentials
- ✗ No Tier 4 data on cloud surfaces
- ✓ All external dependencies flagged
- ✓ PII redacted unless essential
- ✓ NemoClaw enforces privacy veto

---

## Active Risk Register

| Risk | Severity | Mitigation | Status |
|------|----------|-----------|--------|
| openclaw-web-search egress | Critical | Plugin disabled; confirm remediation | Open |
| NemoClaw not yet installed | High | Verify via audit | Open |
| Claude.ai non-private channel | High | Use Claude Code locally for Tier 3/4 | Ongoing |
| Telegram token loss | Medium | AES-256-CBC persistence layer | Backlog |

---

## Eight Architectural Principles

1. **Cybersecurity first** — Top-level design constraint
2. **Local-first by default** — Cloud routing requires justification
3. **Privacy veto non-negotiable** — Data tier determines routing
4. **Audit before prescribe** — Never assume fresh state
5. **Skill as system** — Master skill is source of truth
6. **Backup before any change** — No exceptions
7. **Token persistence architectural debt** — Solve structurally
8. **Institutional rigor applied to AI** — Capital preservation discipline

---

## Support & References

- **Master Agent Definition:** `agents/macmini-ai-coach.md`
- **Session Rules & Protocol:** `rules/macmini/session-rules.md`
- **Operational Procedures:** `docs/macmini/ops-runbook.md`
- **Security Guardrails:** `rules/macmini/security-compliance.md`
- **Deployment Procedures:** `skills/macmini-ai-coach/macmini-enterprise-build.md`

**For audit support:** `scripts/macmini/audit.js`

---

**Version 4.0 | Classification: Confidential | Last Updated: 2026-05-02**
