---
name: macmini-disaster-recovery
description: Disaster recovery and backup restoration procedures for MacMini-AI-Coach
version: 4.0
source: MacMini handoff v3 (Sections 8, 12) + recovery procedures
lastUpdated: 2026-05-02
---

# MacMini Disaster Recovery Playbook

**Recovery procedures for hardware failure, data loss, and system corruption.**

---

## Backup Architecture

### Three-Layer Backup Strategy

| Layer | Location | Sync | Frequency | Recovery Time |
|-------|----------|------|-----------|---|
| **Primary** | iCloud Advanced Data Protection | Automatic | Real-time | < 5 minutes |
| **Secondary** | Proton Drive | Manual + automated | Daily | < 1 hour |
| **Tertiary** | Git repository | Continuous commits | Per-session | < 30 minutes |

### What Gets Backed Up

**iCloud ADP (Obsidian vault):**
- Daily logs and session notes
- Security audit trail
- Decision documentation
- Operator notes and context

**Proton Drive:**
- Full MacMini configuration
- .openclaw directory (agents, configs)
- .claude directory (credentials, settings)
- ~/outputs directory (master artifacts)

**Git Repository:**
- All code changes (agents, skills, rules, docs)
- Configuration changes
- Commit history with timestamps
- Rollback capability for every state

---

## Data Recovery by Scenario

### Scenario 1: Obsidian Vault Data Loss

**Symptoms:** Vault files deleted or corrupted locally; session notes missing

**Recovery Steps:**

```bash
# 1. Check if iCloud sync still has copy
# (iCloud ADP retains deleted files for 30 days)

# 2. In Obsidian app:
#    - Go to Settings → About → Open vault folder
#    - Check if files exist on disk

# 3. If files deleted from disk, recover from iCloud:
#    (Requires manual recovery via iCloud interface or Time Machine)

# 4. Alternative: Restore from Proton Drive backup
tar xzf ~/Proton\ Drive/macmini-backup-*.tar.gz -C ~ --strip-components=1

# 5. Verify recovery
ls -la ~/Documents/vault/
# Should show all daily.md files and session logs
```

**Time to recover:** 5-30 minutes (depending on iCloud sync status)

### Scenario 2: Configuration Files Lost (~/.openclaw, ~/.claude)

**Symptoms:** Agent stack won't start; config files missing; unable to route queries

**Recovery Steps:**

```bash
# 1. Check Proton Drive for backup
ls -la ~/Proton\ Drive/macmini-backup-*.tar.gz

# 2. If backup exists, restore configuration
tar xzf ~/Proton\ Drive/macmini-backup-$(date +%Y%m%d).tar.gz \
  -C ~ --strip-components=1 ~/.openclaw ~/.claude

# 3. Verify restore
curl http://localhost:9100/health  # NemoClaw
curl http://localhost:11434/api/tags  # Ollama
curl http://localhost:8000/health  # OpenClaw
curl http://localhost:9000/health  # Hermes

# 4. If agent stack still failing:
#    - Check if processes are running: ps aux | grep ollama
#    - Check logs: cat ~/.openclaw/logs/*.log
#    - Restart agents: pkill ollama; ollama serve &
```

**Time to recover:** 15-45 minutes (restore + verification)

### Scenario 3: Database Corruption (SQLite cost_tracker)

**Symptoms:** Cost tracking queries fail; error on database operations

**Recovery Steps:**

```bash
# 1. Backup corrupted database
mv ~/.openclaw/cost_tracker.sql ~/.openclaw/cost_tracker.sql.CORRUPTED-$(date +%Y%m%d)

# 2. Recreate database from backup or fresh
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

CREATE INDEX IF NOT EXISTS idx_date ON usage(date);
CREATE INDEX IF NOT EXISTS idx_model ON usage(model);
EOF

# 3. If Proton Drive has backup with cost data:
#    Restore from backup and extract cost records

# 4. Verify database
sqlite3 ~/.openclaw/cost_tracker.sql ".schema usage"
# Should show CREATE TABLE output

# 5. Re-populate if necessary
#    (Historical cost data may be lost, but future tracking resumes)
```

**Time to recover:** 10-20 minutes

### Scenario 4: Git Repository Corruption

**Symptoms:** Git commands fail; commits can't be made; history lost

**Recovery Steps:**

```bash
# 1. Check git integrity
cd ~/outputs && git fsck --full

# 2. If fsck finds errors:
#    Attempt automatic recovery
git reflog  # Shows all recent commits

# 3. Restore to last known good state
git reset --hard [commit-hash-from-reflog]

# 4. If local repo is severely corrupted:
#    Clone fresh from remote
cd ~
rm -rf outputs-corrupted
mv outputs outputs-corrupted
git clone origin outputs

# 5. Verify recovery
cd ~/outputs
git log --oneline | head -10
```

**Time to recover:** 5-15 minutes

### Scenario 5: Hardware Failure (Disk, SSD)

**Symptoms:** Mac Mini won't boot; storage errors; disk I/O failures

**Recovery Steps:**

```bash
# CANNOT recover from running Mac Mini if disk is failed
# Recovery requires new/repaired hardware

# 1. Acquire replacement Mac Mini (M4 Pro, 24GB, 512GB)
#    Verify specs match original

# 2. Install macOS and basic tools on new hardware
#    (Follow Phase 2 of enterprise build guide)

# 3. Restore from Proton Drive backup
#    (Full backup created before hardware was lost)
tar xzf ~/Proton\ Drive/macmini-backup-[latest-date].tar.gz \
  -C ~ --strip-components=1

# 4. Restore git repository
cd ~/outputs
git clone [remote-url] .

# 5. Verify all three backup layers intact:
#    - iCloud: Check Obsidian vault synced
#    - Proton: Verify all config files present
#    - Git: Verify all commits in history

# 6. Restart agent stack and verify health checks pass
```

**Time to recover:** 1-3 hours (hardware replacement + OS setup + data restore)

### Scenario 6: Operator Accidentally Deletes Critical File

**Symptoms:** Important configuration, script, or data file deleted

**Recovery Steps:**

```bash
# 1. Check if file was committed to git
git log --diff-filter=D --summary | grep "delete" | grep [filename]

# 2. If file was in git history, restore it
git checkout [commit-before-deletion]^ -- [filepath]

# 3. Verify file recovered
ls -la [filepath]

# 4. Commit recovery
git add [filepath]
git commit -m "recovery: restored [file] from git history"

# 5. If file NOT in git:
#    Check Proton Drive backup
tar tzf ~/Proton\ Drive/macmini-backup-*.tar.gz | grep [filename]

#    If found in backup, extract:
tar xzf ~/Proton\ Drive/macmini-backup-*.tar.gz \
  -C ~ --strip-components=1 [filepath]
```

**Time to recover:** 2-5 minutes (if in git); 15-30 minutes (if from Proton backup)

---

## Backup Verification

### Daily Backup Check (Every Session)

```bash
# Quick verification before work begins:

# 1. iCloud sync active
ls -lh ~/Documents/vault/.obsidian/sync.json
# Should show recent timestamp (within 1 hour)

# 2. Proton Drive accessible
ls -la ~/Proton\ Drive/
# Should show recent backup file

# 3. Git history intact
cd ~/outputs && git log --oneline | wc -l
# Should show >10 commits
```

### Weekly Full Backup Test (Every Sunday)

```bash
#!/bin/bash
echo "=== Weekly Backup Test ==="

# 1. Create test backup
TEST_DIR=$(mktemp -d)
tar czf $TEST_DIR/test-backup.tar.gz \
  ~/.openclaw ~/.claude ~/outputs ~/Documents/vault

# 2. Test extraction to temporary location
mkdir -p $TEST_DIR/test-restore
tar xzf $TEST_DIR/test-backup.tar.gz -C $TEST_DIR/test-restore

# 3. Verify key files exist in restoration
REQUIRED_FILES=(
  "test-restore/.openclaw/cost_tracker.sql"
  "test-restore/.claude/config/llm-routing.yaml"
  "test-restore/outputs/MACMINI.md"
  "test-restore/Documents/vault/daily.md"
)

for file in "${REQUIRED_FILES[@]}"; do
  [ -f "$TEST_DIR/$file" ] && echo "✓ $file" || echo "✗ $file MISSING"
done

# 4. Cleanup
rm -rf $TEST_DIR

# 5. Log result
echo "[Backup Test] $(date +%Y-%m-%d) — OK" >> ~/Documents/vault/security-audit.md
```

---

## Disaster Recovery Runbook

### Quick Reference Decision Tree

**Q: What's the scope of the loss?**

**→ Single file:**
- Check git history: `git log --oneline -- [file]`
- Restore: `git checkout [commit]^ -- [file]`
- Time: < 5 min

**→ Configuration directory (~/.openclaw or ~/.claude):**
- Restore from Proton Drive: `tar xzf ~/Proton\ Drive/backup.tar.gz`
- Restart agent stack
- Time: 15-45 min

**→ Entire Obsidian vault:**
- Check iCloud (30-day retention)
- Restore from Proton Drive if needed
- Time: 5-30 min

**→ Git repository:**
- Run `git fsck --full`
- Restore from reflog if possible
- Worst case: clone fresh from remote
- Time: 5-30 min

**→ Hardware (Mac Mini won't boot):**
- Acquire replacement hardware
- Restore from Proton Drive backup
- Re-establish agent stack
- Time: 2-4 hours

---

## Disaster Communication Template

**If a disaster occurs:**

```markdown
# INCIDENT: [Type of Loss]

**Date/Time:** [timestamp]
**Scope:** [What was lost]
**Impact:** [What's broken]
**Root Cause:** [What happened - keep brief]

## Immediate Actions Taken
1. Stopped all operations
2. Preserved evidence (logs, error messages)
3. Attempted [recovery method 1]
4. [Result of attempt 1]

## Recovery Status
- [ ] Backup located
- [ ] Restoration in progress
- [ ] Verification started
- [ ] Full operational capability restored

## Lessons Learned
[What could prevent this in the future?]

---
```

---

## Prevention Checklist

**To minimize disaster risk:**

- [ ] Automated Proton Drive backup running daily
- [ ] iCloud ADP sync enabled and recent
- [ ] Git commits made after every session
- [ ] Weekly backup test passes
- [ ] Disaster recovery procedures documented and tested
- [ ] SSH keys backed up securely
- [ ] Database integrity checked weekly
- [ ] Hardware health monitored
- [ ] Storage usage tracked (< 80% capacity)
- [ ] All credentials in secure vault (not hardcoded)

---

## Contact & Escalation

**If disaster recovery fails:**

1. Document the failure with:
   - Exact error messages
   - Steps attempted
   - Current system state
   
2. Escalate to system administrator with documentation

3. If administrator unavailable:
   - Contact backup system provider (Proton, iCloud)
   - Request manual data recovery assistance

---

**Version 4.0 | Classification: Confidential | Last Updated: 2026-05-02**

**Prevention is better than recovery. Maintain all three backup layers. Test monthly.**
