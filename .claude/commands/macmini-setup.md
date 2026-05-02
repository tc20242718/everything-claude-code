---
description: Initialize and verify MacMini-AI-Coach environment for a new Claude Code session
---

# /macmini-setup

**Slash command for MacMini-AI-Coach session initialization.**

Automatically runs startup checks, verifies security posture, and prepares environment for work.

---

## Usage

```bash
/macmini-setup
```

Or with flags:

```bash
/macmini-setup --full      # Full setup with detailed verification
/macmini-setup --quick     # Quick setup (health checks only)
/macmini-setup --audit     # Run comprehensive audit
/macmini-setup --verify    # Verify security posture
```

---

## What It Does

### 1. SSH Verification
- Confirms SSH connection to Mac Mini via Tailscale
- Verifies correct hostname
- Tests command execution

### 2. Audit Execution
- Runs macmini-audit.sh
- Captures delta report
- Identifies blockers or warnings

### 3. Health Checks
- NemoClaw responding (CRITICAL)
- Ollama models loaded
- OpenClaw orchestrator ready
- Hermes executor responsive

### 4. Security Verification
- web-search plugin disabled
- Ollama localhost-only
- LuLu firewall active
- No uncommitted sensitive changes

### 5. Environment Preparation
- Load session context (git log, recent commits)
- Display work queue (audit delta, priority)
- Request operator approval

### 6. Status Report
- Summary of all checks
- List of blockers (if any)
- Ready/not-ready status
- Recommended next actions

---

## Output Example

```
╔════════════════════════════════════════════════════════════╗
║              MacMini-AI-Coach Setup Report                 ║
║              Timestamp: 2026-05-02T14:30                   ║
╚════════════════════════════════════════════════════════════╝

SSH Connectivity
✓ Connected to macmini.tailscale via Tailscale
✓ Command execution successful

Audit Report
- Status: Clean
- Checks passed: 18
- Warnings: 1 (ClamAV backup pending)
- Blockers: 0

Agent Health
✓ NemoClaw (:9100) — responding
✓ Ollama (:11434) — 3 models loaded
✓ OpenClaw (:8000) — ready
✓ Hermes (:9000) — operational

Security Posture
✓ web-search plugin: disabled
✓ Ollama: localhost-only (127.0.0.1)
✓ LuLu firewall: active
✓ No hardcoded credentials in code

Git Status
- Current branch: claude/review-macmini-handoff-nuUm3
- Latest commits:
  9f981f5 feat(config): add SSH verification, disaster recovery, audit automation...
  5453c31 docs(macmini): add operational guides and security compliance rules
  f6fd8ba feat(skills): add macmini-ai-coach skill framework and deployment...

Work Queue (Audit Delta)
[CRITICAL] - 0 items
[HIGH] - 2 items
  • ClamAV backup verification
  • Weekly LLM performance evaluation
[MEDIUM] - 1 item
  • Update deployment checklist
[LOW] - 0 items

╔════════════════════════════════════════════════════════════╗
║                    READY FOR OPERATIONS                    ║
║                                                            ║
║ Security: ✓ Protected    Cost: ✓ Under budget             ║
║ Backups: ✓ Current       Git: ✓ Clean                      ║
║ Blockers: ✓ None         Approval: ✓ Awaiting operator    ║
╚════════════════════════════════════════════════════════════╝

Next Steps:
1. Review work queue above
2. Obtain operator approval for today's tasks
3. Begin with [CRITICAL] items (if any)
4. Create pre-action snapshot before modifications
5. Log session progress to Obsidian
```

---

## Pre-Requisites

Command requires:
- ✓ Connected to Mac Mini via Tailscale
- ✓ SSH access with key-based authentication
- ✓ macmini-audit.sh present in home directory
- ✓ Read access to ~/.openclaw, ~/.claude, ~/outputs

---

## Flags and Options

### --full
Comprehensive setup with extended verification:
- Full network diagnostics
- Database integrity check
- Backup verification
- Hardware health check
- Full security scanning

**Duration:** 2-3 minutes

### --quick
Minimal setup, only critical checks:
- SSH connection
- Agent health (NemoClaw, Ollama, OpenClaw, Hermes)
- Security blockers
- Operator approval request

**Duration:** 30 seconds

### --audit
Run comprehensive audit and display full delta report:
- All audit checks
- Detailed blockers and warnings
- Remediation suggestions
- Configuration status

**Duration:** 1-2 minutes

### --verify
Security-focused setup:
- Tier 4 data check
- Credential scan
- Network isolation verify
- Plugin audit
- LuLu firewall status

**Duration:** 1 minute

---

## Troubleshooting

### Command Fails: "SSH Connection Failed"
```
Check:
1. Is Tailscale running? tailscale status
2. Is Mac Mini online? Ping from Termius app
3. Is SSH key loaded? ssh-add -l

Fix:
tailscale login
or
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_macmini
```

### Command Fails: "Audit script not found"
```
Fix: Copy audit script to home directory
cp scripts/macmini/audit.js ~/macmini-audit.sh
chmod +x ~/macmini-audit.sh
```

### Command Fails: "NemoClaw not responding"
```
This is a BLOCKER. Do not proceed.

Escalate to operator:
1. Check if NemoClaw process running
2. Restart if safe: pkill nemoclaw; [restart command]
3. Verify health: curl http://localhost:9100/health
4. If still fails: Manual investigation required
```

---

## Integration with Session Workflow

Recommended session flow:

```
1. Start Claude Code session
2. /macmini-setup (automatic verification)
3. /review [work item from queue] (begin work)
4. [Pre-action snapshot, execute, verify]
5. /clear (at session end, after logging)
6. [Next agent or operator resumes]
```

---

## Related Commands

- `/macmini-audit` — Run standalone audit (without setup)
- `/macmini-rollback` — Rollback to previous state
- `/macmini-log` — Create session log entry
- `/macmini-cost-check` — Display current API spending

---

**Version 4.0 | Classification: Confidential | Last Updated: 2026-05-02**

**Run /macmini-setup before every MacMini-AI-Coach session to ensure operational readiness.**
