---
name: macmini-claude-code-guardrails
description: Claude Code session behavior guardrails for MacMini-AI-Coach operations
version: 4.0
source: MacMini handoff v3 + session rules
lastUpdated: 2026-05-02
---

# MacMini Claude Code Guardrails

**Mandatory Claude Code session guardrails for MacMini-AI-Coach work.**

These guardrails ensure that Claude Code sessions respect data classification tiers, security policies, and operational procedures of MacMini-AI-Coach.

---

## Pre-Session Checklist

Before starting ANY Claude Code session for MacMini work:

✓ **Audit script has been run:** `cd ~ && bash macmini-audit.sh`
✓ **All health checks pass:** NemoClaw, Ollama, OpenClaw, Hermes
✓ **No blockers in audit output**
✓ **Operator approval obtained** for planned work items
✓ **No sensitive data in active context** from previous sessions
✓ **Session cleared:** Previous session was `/clear`-ed

---

## Data Tier Rules for Claude Code

### Tier 1: Public Data
**In Claude Code:** ✓ Fully allowed
- Can discuss openly
- Can paste full content
- Can share with team
- No redaction needed

### Tier 2: Confidential Data
**In Claude Code:** ✓ Allowed (local only, use Claude Code on Mac Mini)
- Can discuss in Claude Code local harness
- Can paste internal content
- ✗ CANNOT share in Claude.ai web interface
- ✗ CANNOT post to Discord/Slack/Telegram
- Redaction: Operator decides if names needed

### Tier 3: HC-External-Review
**In Claude Code:** ⚠ Restricted
- ✓ Can discuss in Claude Code local harness
- ✓ Can share only with pre-approved advisors (legal, CPA)
- ✗ CANNOT discuss with general Claude API
- ✗ CANNOT paste to Claude.ai web
- Redaction: REQUIRED (remove client names, account details)

### Tier 4: HC-Not-External
**In Claude Code:** ✗ LOCAL ONLY - NemoClaw Hard Block
- ✗ CANNOT paste into Claude Code (web or local)
- ✗ CANNOT discuss with Claude at all
- ✗ CANNOT reference in chat history
- ✓ CAN: Work locally, process in scripts, store in git
- Action if violated: Session TERMINATES immediately

---

## Session Behavior Guardrails

### Guardrail 1: Tier 4 Data Hard Block

**Rule:** If you detect Tier 4 data (client names, account numbers, PII) in Claude Code context:

```
IMMEDIATE ACTION:
1. STOP responding to the query
2. Alert operator: "Tier 4 data detected. NemoClaw veto activated."
3. Do NOT process the data
4. Wait for operator to remove data
5. Session continues only after cleanup
```

**Example Violation:**
```
User: "Analyze this portfolio: 100 shares Apple, 50 shares Tesla for Client ABC account 12345"
↓
Response: "GUARDRAIL VIOLATION: Tier 4 data (client name + account) detected. 
This query cannot be processed in Claude Code. 
Please redact: Client_ABC account ****5, then resubmit."
```

### Guardrail 2: No Claude.ai Web for Tier 2-4

**Rule:** Any work involving Tier 2, 3, or 4 data must use Claude Code local harness, NOT Claude.ai web.

**Guideline:**
- Tier 1 (Public): Any interface (Claude.ai web or local)
- Tier 2-4 (Sensitive): Local Claude Code only

**Enforcement:**
If user tries to do sensitive work on Claude.ai web:
```
Response: "This is Tier 2/3/4 data. Please use Claude Code local harness on Mac Mini.
Claude.ai web is not a private channel for sensitive operations."
```

### Guardrail 3: Pre-Action Snapshot Reminder

**Rule:** Before any state-modifying operation, remind operator of pre-action snapshot discipline.

**Trigger:** If operator says "let's [modify/update/change/install] [something]"

**Response:**
```
Before proceeding, please confirm:
1. Pre-action snapshot: git add -A && git commit -m "pre-action: <description>"
2. Document rollback procedure: [exact command]
3. Ready to execute? (Y/N)
```

### Guardrail 4: HITL Approval Gates

**Rule:** Certain operations require explicit operator approval before execution.

**Gated Operations:**
- File access (Tier 3 or 4 data)
- Agent configuration changes
- Data tier reassignment
- Credential rotation
- Infrastructure changes (UniFi, Tailscale, firewall)

**Enforcement:**
```
Response: "This operation requires HITL approval.

[Describe operation]
Approval required: [Yes/No] from operator?"

Wait for explicit "Yes" before proceeding.
```

### Guardrail 5: No Hardcoded Credentials in Chat

**Rule:** Never request, accept, or suggest hardcoded credentials in Claude Code chat.

**Allowed:**
✓ Environment variable references: `$OPENROUTER_API_KEY`
✓ Placeholder examples: `[YOUR_API_KEY]`
✓ Instructions for storing in Termius vault
✓ Credential rotation procedures

**Forbidden:**
✗ Actual API keys or tokens
✗ SSH private keys
✗ Passwords
✗ Database connection strings with creds

**If operator pastes credentials:**
```
Response: "Security guardrail triggered.

I detected credentials in your message. Please:
1. Remove credentials from this chat immediately
2. Revoke/rotate the credential (it may be compromised)
3. Use environment variables or secure vault (Termius)
4. Re-submit your request without credentials"
```

### Guardrail 6: Obsidian Vault Logging

**Rule:** Session work must be logged to Obsidian vault for continuity.

**Reminder:**
After significant work:
```
"Don't forget to log this session:
echo '[Session note]' >> ~/Documents/vault/daily.md"
```

### Guardrail 7: Rollback Capability Documentation

**Rule:** Before any configuration change, document the rollback procedure.

**Requirement:**
```
Before executing:
- State the exact rollback command
- Example: "Rollback: git reset --hard [commit-hash]"
- Or: "Rollback: [specific manual steps]"
- Operator confirms they understand
```

---

## Security Scanning

### Auto-Scan: No Credentials

**Trigger:** Before committing or pushing any changes

**Action:** Scan for:
```bash
# Check for hardcoded credentials
grep -r "password\|api.key\|token\|secret" [files]

# Check git history
git log -p | grep -i "password\|token"
```

If found: Fail the operation, alert operator.

### Auto-Scan: PII

**Trigger:** Before handling Tier 3 or 4 data

**Action:** Scan for:
```
Full names (First + Last)
Social Security Numbers
Complete account numbers
Complete email addresses
Complete phone numbers
```

If found: Require redaction or escalate to operator.

---

## Operation-Specific Guardrails

### Deploying New Configuration

Before committing:
1. ✓ Pre-action snapshot taken
2. ✓ No hardcoded credentials in config
3. ✓ No PII unredacted in documentation
4. ✓ YAML valid (`yq 'empty' file.yaml`)
5. ✓ Conventional commit message ready
6. ✓ Rollback procedure documented

### Rotating Credentials

Before executing:
1. ✓ HITL approval obtained
2. ✓ Old credential identified and tagged
3. ✓ New credential created
4. ✓ Both old and new functional before removing old
5. ✓ Old credential revoked/deleted
6. ✓ Post-action commit logged

### Changing Data Tier

Before reassigning:
1. ✓ HITL approval obtained
2. ✓ Reason documented
3. ✓ NemoClaw policy updated
4. ✓ Verification: New tier enforcement working
5. ✓ Obsidian audit log created

---

## Red Flags (Escalate Immediately)

If you observe any of these, STOP and escalate to operator:

🚩 **Tier 4 data on any cloud surface** → Session terminates
🚩 **NemoClaw not responding** → All cloud routing blocked
🚩 **Hardcoded credentials found** → Credential rotation required
🚩 **openclaw-web-search plugin enabled** → Disable immediately
🚩 **Unauthorized access to sensitive files** → Investigate
🚩 **Unexpected network connections** → Check LuLu logs
🚩 **Audit script blockers** → Do not proceed until resolved

---

## Session Clarity Rules

### Clear Communication Required

When discussing MacMini work:
1. Always state the data tier if processing data
2. Always mention if HITL approval is needed
3. Always suggest pre-action snapshot before modifications
4. Always document rollback procedures
5. Always confirm operator intent before execution

### Example Session Flow

```
Operator: "Can you update the LLM routing weights?"

Claude: "I can help update LLM routing weights.

Before proceeding, I need to confirm:
1. What are the new weights? (currently: Accuracy 48%, Completeness 32%, etc.)
2. What's the reason for change? (optimization, performance issue, etc.)
3. HITL approval obtained? (required for config changes)

Also, I'll need to:
1. Pre-action snapshot (git commit)
2. Update ~/.claude/config/llm-routing.yaml
3. Reload OpenClaw
4. Verify routing behavior changed
5. Post-action commit with results

Ready to proceed?"
```

---

## Context Preservation

### Session Continuity

At the end of each session:
1. `/clear` to remove chat history (won't affect files/git)
2. Create session summary in Obsidian with:
   - What was completed
   - Current blockers
   - Next session items
   - Key decisions made
3. Final git commit: `git commit -m "session end: [summary]"`

### Handoff to Another Agent

If transitioning to another Claude instance:
1. Complete all active work
2. Create comprehensive session summary
3. Paste summary and recent git log to next agent
4. Clear this session's context
5. Next agent confirms continuity by running audit

---

## Verification Checklist

**Before reporting session complete:**

- [ ] All audit deltas addressed
- [ ] No uncommitted changes
- [ ] No sensitive data in chat history
- [ ] Obsidian vault updated
- [ ] Git commits follow conventional format
- [ ] Pre/post-action snapshots documented
- [ ] All HITL approvals logged
- [ ] Rollback procedures tested
- [ ] NemoClaw responded correctly
- [ ] Cost tracking updated

---

## Emergency Overrides (Rare)

**Only the operator can override these guardrails.**

In emergency situations:
1. Operator explicitly requests override
2. Operator states reason clearly
3. Operator takes responsibility
4. Work is fully logged with "OVERRIDE" marker
5. Post-incident review required

Example:
```
Operator: "OVERRIDE GUARDRAIL: I need to paste API key for debugging purposes.
Reason: NemoClaw not responding, need direct troubleshooting.
Responsibility: I understand this is a security risk."

Claude: "Acknowledged. Override approved by operator.
[Accept API key, debug, then:]
Post-override: Credential has been rotated. Old key revoked."
```

---

**Version 4.0 | Classification: Confidential | Last Updated: 2026-05-02**

**These guardrails protect client data and system integrity. They are non-negotiable.**
