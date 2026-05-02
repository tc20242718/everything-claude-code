---
name: macmini-context-handoff
description: Session continuity and context management procedures for MacMini-AI-Coach deployments
version: 4.0
source: MacMini instructions v1 (Section 5 + Session Management) + handoff v3
lastUpdated: 2026-05-02
---

# MacMini Context Handoff Procedures

Procedures for maintaining session continuity and state management when handing off work between Claude Code sessions, agents, or operator interventions. Ensures zero information loss and unbroken audit trail.

---

## Purpose

Session handoff procedures ensure:

1. **Continuity** — No work lost or forgotten between sessions
2. **Auditability** — Complete record of who did what and when
3. **State Preservation** — All uncommitted work captured before transition
4. **Security** — No sensitive data left in active memory
5. **Authorization** — Clear sign-off trail for HITL-gated decisions
6. **Rollback Capability** — Each session can be individually rolled back

---

## Pre-Handoff Checklist

**Before handing off to another agent, operator, or session, complete this exact sequence:**

### 1. Complete Active Work Item

If currently executing a work item:

```bash
# Finish the task
# (Run tests, verify output, document result)

# Commit all changes
git add -A && git commit -m "complete: <item> — <result summary>"
```

### 2. Stage Uncommitted Work (if partial)

If mid-task and need to pause:

```bash
# DO NOT leave uncommitted work
git add -A && git commit -m "wip: <item> — paused pending [reason]"

# Example:
# git commit -m "wip: LLM routing weights — paused pending operator data"
```

### 3. Verify Git History Is Clean

```bash
git status  # Should show: "nothing to commit, working tree clean"
git log --oneline -n 3  # Should show recent commits
```

**If not clean:** Stash or commit everything before handing off.

### 4. Create Session Summary (Mandatory)

Create a markdown summary document with these sections:

```markdown
# Session Summary — 2026-05-02T14:30

## Operator
Your Name / Agent Name

## Work Completed
- [ ] Item 1 (commit hash: abc123)
- [ ] Item 2 (commit hash: def456)
- [x] Item 3 (BLOCKED: reason)

## Current State
- NemoClaw: Responding ✓
- Ollama: 3 models loaded ✓
- API spend: $12.50/month (Claude), $8.20/month (Grok)
- Last audit: Clean (0 blockers)

## Open Items (Priority Order)
1. [CRITICAL] Ops runbook deployment phase
2. [HIGH] LLM routing weight optimization
3. [MED] Weekly performance audit

## Blockers
- openclaw-web-search remediation status (check before re-enabling)

## Next Session Should
1. Run audit: `cd ~ && bash macmini-audit.sh`
2. Verify security posture (NemoClaw, Ollama, LuLu)
3. Get operator approval on delta
4. Resume with [CRITICAL] item above

## Key Decisions Made
- Data tier assignments: [list any]
- Configuration changes: [list any]
- Credential rotations: [list any]

## Audit Trail
- Session started: 2026-05-02T09:00
- Session ended: 2026-05-02T14:30 (5.5 hours)
- Commits: 3 successful, 0 failed
- Rollbacks: 0
```

**Save this summary to:** `~/Documents/vault/sessions/session-2026-05-02-1430.md`

### 5. Verify Obsidian Sync Active

```bash
# Check if iCloud Advanced Data Protection is syncing
# (Visual check in Obsidian app: look for sync status icon)

# Or check file timestamps
ls -lh ~/Documents/vault/.obsidian/sync.json
```

If not syncing:
```bash
# Force sync in Obsidian: Cmd + Shift + P → "Obsidian Sync: Force sync now"
# Or wait 30 seconds for automatic sync
```

### 6. Verify No Sensitive Data in Session Context

**Before clearing Claude Code session, scan for sensitive data:**

```bash
# Check session transcript would not expose:
# - Tier 3/4 data (client names, account numbers, positions)
# - API keys or tokens
# - Passwords or SSH keys
# - Internal IP addresses
# - Unredacted personally identifiable information
```

If found: **Do NOT clear session.** Document location and ask operator for redaction instructions.

### 7. Clear Claude Code Session (Safe to Do)

```bash
# In Claude Code terminal
/clear
```

This clears the session history but does NOT:
- Delete any files
- Remove git commits
- Affect Obsidian vault
- Expose any data (assuming step 6 passed)

---

## Handoff to Another Agent

When delegating work to another Claude Code agent (e.g., code-reviewer, architect):

### 1. Complete Pre-Handoff Checklist (Above)

### 2. Compose Handoff Brief (3-4 paragraphs max)

```markdown
## Handoff to [Agent Name]

**Current Status:** [1 sentence on overall progress]

**What was completed:**
- [Item 1] (commit hash)
- [Item 2] (commit hash)

**What's next:**
- [Item 3] with these specific requirements
- [Item 4] considering these constraints

**Critical context:**
- [Key decisions made]
- [Known blockers]
- [Operator preferences/constraints]

**Files to review:**
- agents/macmini-ai-coach.md (master agent definition)
- rules/macmini/session-rules.md (operating rules)
- docs/macmini/ops-runbook.md (daily operations)

**Git state:**
- Current branch: claude/review-macmini-handoff-nuUm3
- Latest commit: [hash] — [message]
- Working tree: Clean ✓
```

### 3. Paste Handoff Brief + Recent Git Log

In your handoff message to the agent:

```
[Paste handoff brief from step 2]

Recent commits:
[Paste: git log --oneline -n 5]

Operator approval required for next phase: [Yes/No/Pending]
```

### 4. Agent Acknowledges and Restarts Session

The receiving agent:
1. Reads handoff brief
2. Runs `git log -n 5` to verify state
3. Runs audit: `cd ~ && bash macmini-audit.sh`
4. Resumes work from where you left off

---

## Handoff to Operator (End of Session)

When operator takes over or session ends:

### 1. Complete Pre-Handoff Checklist (Above)

### 2. Prepare Operator Summary

```markdown
## Session Complete — Ready for Operator Review

**What was delivered this session:**
- [List artifacts created/modified]
- [List issues resolved]
- [List blockers identified]

**Current system state:**
- All services operational ✓
- Security posture: [Protected/At-Risk/Clean]
- Last audit: [timestamp, clean/issues]

**Work queue for next session:**
1. [Item] — Priority [CRITICAL/HIGH/MED/LOW]
2. [Item] — Priority [...]

**Decisions requiring operator input:**
- [Decision 1: Choice A vs Choice B]
- [Decision 2: Proceed with feature X?]

**Git commits this session:**
[Paste: git log --oneline -n 5]

**Time invested:** [hours] hours

**Next session should start with:**
1. Run audit: `cd ~ && bash macmini-audit.sh`
2. Review decisions above
3. Proceed with work queue item #1 pending approval
```

### 3. Paste Summary and Await Operator Response

Provide the summary above, then wait for operator feedback or next session request.

---

## Resuming After Handoff (Start of New Session)

**When starting a new session after handoff:**

### 1. Review Session Summary (if exists)

```bash
# Find and read the most recent session summary
ls -lt ~/Documents/vault/sessions/ | head -1
cat ~/Documents/vault/sessions/[latest]
```

### 2. Verify Git History Matches Handoff

```bash
git log --oneline -n 5  # Should match what was documented
git status              # Should show clean working tree
```

### 3. Run Full Audit

```bash
cd ~ && bash macmini-audit.sh
```

This is THE definitive source of what needs to be done next.

### 4. Retrieve Recent Context

If needed, read the last session's summary for background:

```bash
cat ~/Documents/vault/sessions/[session-date].md | head -30
```

### 5. Get Operator Sign-Off

Present:
- Audit delta (work queue)
- Open blockers
- Proposed priority order

**Wait for explicit approval before resuming work.**

---

## Emergency Handoff (Incident Response)

If emergency occurs mid-session (security breach, hardware failure, etc.):

### 1. STOP All Work Immediately

No further queries or operations.

### 2. Preserve State (Minimal Steps)

```bash
# Only if safe to do so:
git add -A && git commit -m "INCIDENT: [brief description] — [timestamp]"

# Do NOT delete anything
# Do NOT modify logs
# Do NOT clear Obsidian
```

### 3. Document Incident

```markdown
# INCIDENT REPORT — [timestamp]

**What happened:**
[1 paragraph description]

**Timeline:**
- HH:MM — [event 1]
- HH:MM — [event 2]

**Evidence:**
[File paths where evidence can be found]

**Immediate actions taken:**
1. [Action 1]
2. [Action 2]

**Operator should:**
1. [Recommended investigation]
2. [Recommended remediation]
```

Save to: `~/Documents/vault/incidents/incident-[timestamp].md`

### 4. Escalate to Operator

Pass incident report and wait for instructions.

---

## State Preservation Details

### What Gets Preserved Across Sessions

✓ **Git commits** — All work is committed
✓ **File changes** — All modified files tracked in git
✓ **Configuration** — All config changes committed
✓ **Obsidian log** — Session notes persisted to vault
✓ **Environment variables** — Persist across SSH sessions
✓ **Installed packages** — Persist in package.json
✓ **Database state** — Persists in SQLite (cost_tracker, etc.)

### What Does NOT Persist (Clear on Handoff)

✗ **Claude Code session history** — `/clear` wipes it
✗ **Terminal history** — (OK to clear, not critical)
✗ **Uncommitted git changes** — (Must be committed first)
✗ **Temporary files** — (Clean up before handing off)

### What MUST NEVER Be in Session Context

✗ **Tier 3/4 data** — Client names, PII, account numbers
✗ **API keys or tokens** — Use environment variables
✗ **SSH private keys** — Use secure storage (Termius vaults)
✗ **Passwords** — Never paste or type in session
✗ **Internal IP addresses** — Redact with placeholders

---

## Session Log Template

Use this template for daily session logs in Obsidian:

```markdown
## 2026-05-02 — Session Log

### Session Start
- Time: 14:00
- Agent: Claude (Code harness)
- Previous session: [link to previous]

### Audit Results
- Status: Clean / [N] issues
- Critical blockers: [list if any]
- Next work item: [item from delta]

### Work Completed
1. ✓ [Item 1] (commit: abc123)
   - Result: [brief outcome]
   - Time: 45 min
   
2. [Item 2] in progress
   - Current state: [brief description]
   - Blocker: [if any]

### Decisions Made
- [Decision 1]: Chose [option] because [reason]
- [Decision 2]: [...]

### Rollback Trail
- Pre-action 1: `git reset --hard abc123`
- Pre-action 2: [...]

### Session End
- Time: 14:30
- Status: Complete / Paused
- Next agent: [name or "operator"]
- Summary: [1 sentence]

---
```

---

## Context Window Best Practices

### To Preserve Context Across Sessions

1. **Commit frequently** — Small, focused commits
2. **Document decisions** — Log HITL approvals
3. **Annotate blockers** — Mark what's waiting on operator
4. **Use descriptive commit messages** — Make history searchable
5. **Update Obsidian daily** — Session logs are your reference

### To Minimize Context Bloat

1. **Don't paste large files** — Reference by path instead
2. **Clean up session history** — Use `/clear` regularly
3. **Archive old logs** — Move old session notes to archive folder
4. **Compress git history** — (Rare, ask operator first)

---

## Recovery from Failed Handoff

If handoff went wrong (session lost, data missing, etc.):

### 1. Verify Git History Intact

```bash
git log --all --oneline | wc -l  # Should show all commits
git reflog | head -5              # Shows recovery options
```

### 2. Recover from Git

```bash
# Last known good state:
git reset --hard HEAD~1

# Or to a specific commit:
git reset --hard [commit-hash]

# Or restore a file:
git checkout [commit-hash] -- [filename]
```

### 3. Verify Obsidian Backup

```bash
# Check iCloud sync or Proton Drive backup
ls -lh ~/Proton\ Drive/vault/
# Or check Obsidian Sync in app
```

### 4. Escalate if Data Lost

If unable to recover:
- Note timestamp of loss
- Document what's missing
- Escalate to operator with recovery plan

---

## Handoff Checklist (Print This)

Before every handoff, verify:

- [ ] All work committed (`git status` shows clean)
- [ ] Session summary created (saved to Obsidian)
- [ ] Obsidian sync active (confirmed synced)
- [ ] No sensitive data in session history
- [ ] Recent commits documented (`git log -n 5`)
- [ ] Open items prioritized (CRITICAL/HIGH/MED/LOW)
- [ ] Blockers clearly identified
- [ ] Operator decisions documented
- [ ] Session history reviewed (nothing missed)
- [ ] Claude Code session cleared (`/clear`)
- [ ] Handoff brief ready (concise, 3-4 paragraphs)

---

**Version 4.0 | Classification: Confidential | Last Updated: 2026-05-02**

**Proper handoff procedure ensures zero information loss and maintains complete audit trail.**
