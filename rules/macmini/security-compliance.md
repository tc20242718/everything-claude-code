---
name: macmini-security-compliance
description: Security and compliance rules for MacMini-AI-Coach deployments
version: 4.0
source: MacMini handoff v3 (Sections 6, 13-15) + security standards
lastUpdated: 2026-05-02
---

# MacMini Security & Compliance Rules

**Mandatory security requirements for all MacMini-AI-Coach operations.**

These rules are non-negotiable. Violation of these rules results in immediate session termination and escalation.

---

## Data Classification and Tier Routing

### Tier 1: Public Data

**Definition:** Information suitable for public disclosure. No confidentiality concerns.

**Examples:**
- General announcements
- Published research
- Marketing materials
- Publicly available information

**Routing Rules:**
- ✓ Can be routed to ANY channel
- ✓ Can be processed by ANY LLM (local or cloud)
- ✓ Can be logged publicly
- ✓ Can be cached indefinitely

**Enforcement:** Trust but verify. Use common sense.

---

### Tier 2: Confidential Data

**Definition:** Internal information requiring confidentiality. Not for external disclosure.

**Examples:**
- Internal meeting notes
- Operational procedures
- Strategic plans
- Financial summaries
- Non-client-identifying data

**Routing Rules:**
- ✓ Can route to: Obsidian, Proton Drive, iCloud ADP
- ✗ CANNOT route to: Telegram, Discord, Slack, Claude.ai web
- ✗ CANNOT route to: Public LLMs without review
- ✓ Can route to: Local Ollama
- ✓ Can route to: Private cloud routes (Claude via OpenRouter only)

**Enforcement:** Pre-classification mandatory. Operator declares tier.

**Compliance Check:**
```bash
# Before processing Tier 2 data, verify:
# 1. Data is not Tier 3 or 4 (more restricted)
# 2. Route is approved (not public cloud, not Telegram)
# 3. NemoClaw has not flagged it for upgrade
```

---

### Tier 3: HC-External-Review

**Definition:** Highly confidential data requiring restricted sharing. Only to approved external advisors (legal, CPA, etc.)

**Examples:**
- Legal strategy and analysis
- Tax planning documents
- Regulatory compliance filings
- External advisor communications
- Client case studies (names redacted)

**Routing Rules:**
- ✓ Can route to: Obsidian (local)
- ✓ Can route to: Legal/CPA advisors (pre-approved only)
- ✗ CANNOT route to: Telegram, Discord, Slack, ANY cloud except approved advisors
- ✗ CANNOT route to: Public or general-purpose LLMs
- ✓ Can route to: Private advisor review systems only

**Enforcement:** HITL approval required before every access.

**Process for Tier 3 Operations:**
```
1. Operator proposes Tier 3 operation: "I need legal review of [document]"
2. Administrator confirms:
   - Is this really Tier 3? (Not Tier 4?)
   - Is route pre-approved? (Specific advisor?)
   - Is redaction appropriate? (Remove client names?)
3. Administrator approves or denies
4. If approved, execute with FULL AUDIT TRAIL
5. Log who accessed, when, result
```

---

### Tier 4: HC-Not-External (HIGHEST RESTRICTION)

**Definition:** Highest confidentiality level. Client-facing PII and internal accounts. LOCAL ONLY.

**Examples (MUST BE REDACTED):**
- ✗ "Client ABC account number 12345"
- ✓ "Client_A account number ****5"
- ✗ "Sarah Johnson manages portfolio of $2M"
- ✓ "Advisor_X manages portfolio of significant assets"
- ✗ "Positions: 100 shares Apple, 50 shares Tesla"
- ✓ "Positions: [count] shares [symbol]"

**Routing Rules:**
- ✓ Can route to: LOCAL ONLY (Claude Code on Mac Mini, no cloud)
- ✗ CANNOT route to: Telegram (hard block)
- ✗ CANNOT route to: Discord (hard block)
- ✗ CANNOT route to: Slack (hard block)
- ✗ CANNOT route to: Claude.ai web (hard block)
- ✗ CANNOT route to: ANY cloud service whatsoever (hard block)
- ✗ CANNOT route to: Ollama (cloud fallback) (hard block)

**Enforcement:** NemoClaw hard block. Zero exceptions. No human override.

**If Tier 4 data appears on ANY cloud surface:**
- Session TERMINATES immediately
- Full forensic audit executed
- Operator credentials reviewed
- Incident report filed
- Investigation mandated

---

## PII Redaction Standards

### What is PII?

Personally Identifiable Information includes:
- Full names (first + last)
- Social Security Numbers
- Account numbers (complete)
- Email addresses (personal)
- Phone numbers
- Addresses (complete)
- Dates of birth
- Financial account details

### Redaction Placeholders

**Use these consistent placeholders:**

| Type | Original | Redacted |
|------|----------|----------|
| Name | "John Smith" | Client_A, Advisor_X |
| Account | "Account 123456" | Account_XXX |
| Amount | "$2,500,000" | "Significant assets" |
| Position | "100 Apple, 50 Tesla" | "[Count] shares [Symbol]" |
| Contact | "john@example.com" | Client_A@internal |
| Location | "123 Main St, NYC" | "[Location]" |
| Date | "2025-03-15" | "[Date]" |
| SSN | "123-45-6789" | "****6789" (last 4 only) |

### Redaction Verification

Before processing ANY data that might contain PII:

```bash
# Check for name patterns
echo "$DATA" | grep -E "[A-Z][a-z]+ [A-Z][a-z]+" && echo "POSSIBLE NAME - REDACT"

# Check for email
echo "$DATA" | grep -E "[a-z]+@[a-z]+\.[a-z]+" && echo "EMAIL - REDACT"

# Check for numbers that might be accounts
echo "$DATA" | grep -E " [0-9]{8,}" && echo "POSSIBLE ACCOUNT NUMBER - REDACT"

# If any matches: Redact using placeholders above
```

---

## Credentials and Secrets Management

### What is a Secret?

- API keys (OpenRouter, anthropic, etc.)
- OAuth tokens
- SSH private keys
- Passwords
- Database connection strings
- Any authentication credential

### Storage Rules (Mandatory)

**NEVER:**
- ✗ Hard-code credentials in code
- ✗ Paste credentials into Claude Code or any chat
- ✗ Store credentials in Obsidian or iCloud
- ✗ Send credentials over unencrypted channels

**ALWAYS:**
- ✓ Store credentials in environment variables
- ✓ Store in Termius 8-Vault (encrypted)
- ✓ Store in 1Password or similar vault (operator's choice)
- ✓ Rotate credentials monthly
- ✓ Audit who has access to credentials

### Credential Rotation Procedure

Monthly (or after suspected compromise):

```bash
# Example: OpenRouter API key rotation

# 1. Generate new key
# (Operator: Log into OpenRouter account, generate new key)

# 2. Pre-action snapshot
git add -A && git commit -m "pre-action: API key rotation"

# 3. Update environment
# (In Termius vault: Update OPENROUTER_API_KEY)
export OPENROUTER_API_KEY="[new-key]"

# 4. Verify new key works
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  https://openrouter.ai/api/v1/auth/key/info

# 5. Revoke old key
# (Operator: Log into OpenRouter, delete old key)

# 6. Post-action commit
git add -A && git commit -m "complete: API key rotation successful"

# 7. Obsidian log
echo "## API Key Rotation
Date: $(date)
Old key: Deleted from OpenRouter
New key: [REDACTED - stored in Termius vault]
Rollback: Not applicable (keys deleted)" >> ~/Documents/vault/security-audit.md
```

---

## Network Security Rules

### Outbound Firewall (LuLu)

**Must Be Active At All Times**

```bash
# Verify LuLu running
pgrep -x LuLu && echo "LuLu is active" || echo "FAIL: LuLu not running"
```

**Key Rules:**
- ✓ Allow Mac processes to internet (for cloud routing)
- ✗ BLOCK Ollama (:11434) from internet
- ✗ BLOCK all unknown processes from internet
- ✓ Log all blocked connections

### Network Isolation Requirements

- ✓ Ollama MUST bind to 127.0.0.1 (localhost only)
- ✓ OpenClaw MUST bind to 127.0.0.1
- ✓ Hermes MUST bind to 127.0.0.1
- ✓ NemoClaw MUST bind to 127.0.0.1

**Verification:**
```bash
lsof -i :11434 | grep LISTEN  # Should show: 127.0.0.1 (NOT 0.0.0.0)
lsof -i :8000 | grep LISTEN   # Should show: 127.0.0.1
lsof -i :9000 | grep LISTEN   # Should show: 127.0.0.1
lsof -i :9100 | grep LISTEN   # Should show: 127.0.0.1
```

### VPN/Tailscale Requirements

- ✓ SSH access ONLY via Tailscale (no direct SSH port)
- ✓ Tailscale connection MUST be active before operations
- ✓ Tailscale key MUST be kept secure
- ✗ Never share Tailscale keys

---

## Plugin and Extension Security

### Approved Plugins Only

**Obsidian plugins (whitelisted):**
- ✓ Templater
- ✓ Dataview
- ✓ Calendar
- ✓ Periodic Notes

**All other plugins:**
- ✗ FORBIDDEN without explicit security review

### Plugin Review Checklist

Before installing any plugin, verify:
- [ ] Is it requesting network access? (RED FLAG)
- [ ] Is it accessing files outside vault? (RED FLAG)
- [ ] Is it open-source? (GREEN - can audit code)
- [ ] Is it maintained and updated? (GREEN)
- [ ] Has administrator reviewed and approved? (MANDATORY)

**If plugin requests network access:**
- Assume it's a risk
- Don't install without security review
- Document the review in security-audit.md

---

## Audit and Logging Requirements

### What Gets Logged?

**MUST BE LOGGED:**
- ✓ Every session (start time, operator, summary)
- ✓ Every HITL approval (what was approved, when, by whom)
- ✓ Every credential rotation (date, what was rotated)
- ✓ Every data tier assignment/change (what data, to what tier)
- ✓ Every pre/post-action snapshot (git commits)
- ✓ Every security incident or anomaly

**Example log entry:**
```markdown
## 2026-05-02T14:30 — Tier 4 Data Classification

**Action:** Classified client_accounts.csv as Tier 4
**Operator:** John Doe
**Approval:** Explicit HITL approval obtained
**Method:** NemoClaw policy updated
**Enforcement:** Hard block on cloud routing
**Verification:** curl test passed (tier 4 data rejected from cloud route)
**Rollback:** git reset --hard [commit-before-classification]

**Evidence:**
- Pre-action: commit abc123
- Post-action: commit def456
- NemoClaw test: passed
```

### Log Storage and Retention

**Primary log location:** `~/Documents/vault/daily.md` (synced via iCloud ADP)
**Backup log location:** `~/Proton\ Drive/security-audit.md`
**Git history location:** All commits in git history

**Retention:**
- Daily logs: Keep 90 days minimum
- Security incidents: Keep 1 year minimum
- Credential rotations: Keep indefinitely (for audit trail)
- Access logs: Keep 6 months minimum

---

## Compliance Checkpoints

### Weekly Security Audit

Run every Sunday:

```bash
# 1. Verify LuLu active
pgrep -x LuLu && echo "✓ LuLu active" || echo "✗ FAIL: LuLu down"

# 2. Verify no secrets in git
git log -p | grep -i "password\|token\|api.key" | wc -l
# Should return: 0

# 3. Verify no Tier 4 data in logs
grep -r "client.*account\|Social Security\|password" ~/.openclaw/logs/ | wc -l
# Should return: 0

# 4. Verify Ollama localhost-only
lsof -i :11434 | grep "0.0.0.0" && echo "✗ FAIL: Exposed" || echo "✓ Localhost-only"

# 5. Verify iCloud sync active
ls -lh ~/Documents/vault/.obsidian/sync.json
# Should show recent timestamp

# 6. Log audit results
echo "## Weekly Security Audit — $(date +%Y-%m-%d)
- LuLu firewall: ✓ Active
- No secrets in git: ✓ Clean
- No PII in logs: ✓ Clean
- Network isolation: ✓ Verified
- iCloud sync: ✓ Active" >> ~/Documents/vault/security-audit.md
```

### Monthly Compliance Verification

Run on the 1st of each month:

```bash
# Full compliance checklist
cat > ~/Documents/vault/compliance-$(date +%Y-%m).md << 'EOF'
# Monthly Compliance Report — 2026-05-01

## Data Classification Verification
- [ ] All Tier 4 data correctly classified
- [ ] No Tier 4 data on any cloud surface
- [ ] All Tier 3 data restricted to approved advisors only
- [ ] No PII left unredacted

## Credential Security
- [ ] All credentials in environment/vault (not hardcoded)
- [ ] API keys rotated in past month
- [ ] SSH keys verified
- [ ] No credentials in git history

## Network Security
- [ ] LuLu firewall active
- [ ] All agents (9000, 8000, 9100, 11434) localhost-only
- [ ] No unexpected outbound connections
- [ ] Tailscale active and current

## Operational Security
- [ ] Audit script running weekly
- [ ] All sessions logged in Obsidian
- [ ] All HITL approvals documented
- [ ] Pre/post-action snapshots performed

## Backup and Recovery
- [ ] iCloud ADP sync current
- [ ] Proton Drive backup recent
- [ ] Git history intact and accessible
- [ ] Rollback procedure tested

## Incidents and Issues
[List any security issues encountered this month]

## Sign-Off
Verified by: [Name]
Date: [Date]
Status: ✓ Compliant / ✗ Issues Found
EOF
```

---

## Incident Response Procedures

### Data Breach (Tier 3/4 on Cloud)

**If Tier 4 data reaches ANY cloud surface:**

1. **STOP IMMEDIATELY** — Cease all operations
2. **Document incident:**
   ```markdown
   # INCIDENT: Data Breach
   Time: [timestamp]
   Data: [what was exposed - general terms]
   Route: [where it went]
   Evidence: [file paths/logs]
   ```
3. **Preserve evidence** — Do NOT delete logs
4. **Escalate to administrator** with incident report
5. **Administrator action:**
   - Investigate cloud logs
   - Contact cloud provider if needed
   - Rotate all credentials
   - Review access controls
   - Generate remediation plan

---

## Non-Negotiable Rules

**These rules have ZERO exceptions:**

1. ✗ Tier 4 data NEVER on cloud (NemoClaw enforces)
2. ✗ No hard-coded credentials in code
3. ✗ No secrets shared in chat or Claude.ai
4. ✗ No unapproved plugins
5. ✗ No LuLu firewall disabled
6. ✗ No localhost binding changed to 0.0.0.0
7. ✗ No audit skipped
8. ✗ No HITL approval gates bypassed

---

## Regular Maintenance

### Daily (Every Session)
- [ ] Run audit
- [ ] Verify security posture
- [ ] Check health of all agents
- [ ] Review any security warnings

### Weekly (Every Sunday)
- [ ] Run full security audit
- [ ] Check for unexpected logs
- [ ] Verify no PII leakage
- [ ] Confirm backups syncing

### Monthly (1st of month)
- [ ] Generate compliance report
- [ ] Review incident log
- [ ] Rotate credentials (if needed)
- [ ] Test disaster recovery

### Quarterly (Every 3 months)
- [ ] Full security review
- [ ] Penetration test (if available)
- [ ] Policy update review
- [ ] Training refresher for operator

---

**Version 4.0 | Classification: Confidential | Last Updated: 2026-05-02**

**These rules protect client data, operator safety, and system integrity. Violations result in session termination.**
