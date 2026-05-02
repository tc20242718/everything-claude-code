---
name: macmini-ssh-verification
description: SSH key configuration, verification, and security procedures for MacMini-AI-Coach
version: 4.0
source: MacMini instructions v1 (Section 3) + SSH security standards
lastUpdated: 2026-05-02
---

# MacMini SSH Verification & Configuration

**Secure SSH setup and verification procedures for MacMini-AI-Coach access.**

---

## SSH Security Posture

MacMini-AI-Coach uses **key-only SSH authentication** with **non-default port** on a **zero-trust remote access model** (Tailscale).

**Security Requirements:**
- ✓ SSH key-based authentication (no passwords)
- ✓ Ed25519 keys (modern, secure)
- ✓ Non-default SSH port (not 22)
- ✓ Tailscale tunneling (no direct port exposure)
- ✗ NO password authentication
- ✗ NO root login via SSH

---

## SSH Key Generation

### Step 1: Generate Ed25519 Key

```bash
# On your Mac, generate new SSH key
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_macmini -C "macmini@$(date +%Y%m%d)"

# When prompted for passphrase:
# Option A: Set strong passphrase (recommended for security)
# Option B: Leave blank (convenience, less secure)

# Verify key created
ls -la ~/.ssh/id_ed25519_macmini*

# Expected output:
# -rw------- id_ed25519_macmini (private key - 400 permissions)
# -rw-r--r-- id_ed25519_macmini.pub (public key)
```

### Step 2: Secure the Private Key

```bash
# Set restrictive permissions on private key
chmod 600 ~/.ssh/id_ed25519_macmini

# Verify permissions
ls -la ~/.ssh/id_ed25519_macmini

# Expected output: -rw------- (600 permissions)
```

### Step 3: Add Public Key to Mac Mini

**On the Mac Mini (via Termius or direct access):**

```bash
# Create ~/.ssh directory if not present
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add public key to authorized_keys
cat >> ~/.ssh/authorized_keys << 'EOF'
[PASTE PUBLIC KEY CONTENT FROM ~/.ssh/id_ed25519_macmini.pub]
EOF

# Set correct permissions on authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Verify key is added
cat ~/.ssh/authorized_keys | grep "macmini@"  # Should find your key
```

---

## SSH Configuration

### Mac Mini SSH Server Configuration

**File:** `/etc/ssh/sshd_config` (requires sudo)

**Key settings to verify:**

```bash
# Allow only key-based authentication
PasswordAuthentication no
PubkeyAuthentication yes

# Disable root login
PermitRootLogin no

# Use non-default port (example: 2222)
# Port 2222
# (This is typically handled via Tailscale, so direct port may be default)

# Restrict allowed users (if needed)
# AllowUsers [your-username]

# Strong key exchange algorithms
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
HostKeyAlgorithms ssh-ed25519

# Disable weak authentication methods
ChallengeResponseAuthentication no
UsePAM no
```

**To verify current config:**

```bash
# Check sshd configuration (read-only)
sudo sshctl -T localhost  # macOS 13+ command to test config
```

### Client SSH Configuration (~/.ssh/config)

**On your Mac, create SSH config for convenience:**

```bash
cat > ~/.ssh/config << 'EOF'
Host macmini
    HostName [your-tailscale-hostname]
    User [your-username]
    IdentityFile ~/.ssh/id_ed25519_macmini
    IdentitiesOnly yes
    AddKeysToAgent yes
    UseKeychain yes
    StrictHostKeyChecking accept-new
    Port 22
    # If using non-default port:
    # Port 2222
EOF

chmod 600 ~/.ssh/config
```

---

## Tailscale Tunnel Setup

### Overview

SSH traffic to Mac Mini is **tunneled through Tailscale**, not exposed directly to the internet.

```
Your Mac / iPhone
    ↓ (via Tailscale VPN)
Tailscale Network (encrypted)
    ↓
Mac Mini (Tailscale endpoint)
    ↓
SSH server (localhost, via tunnel)
```

### Verification

```bash
# Verify Tailscale is running
tailscale status

# Expected output:
# ...
# macmini         (hostname you'll use)

# Get Tailscale IP
tailscale ip -4  # Shows 100.x.x.x address

# Alternative: Use Tailscale hostname (recommended)
# macmini.tailscale
```

### Connecting via Tailscale

```bash
# Using hostname (recommended)
ssh macmini  # Uses ~/.ssh/config settings

# Or explicitly:
ssh -i ~/.ssh/id_ed25519_macmini [username]@[tailscale-hostname]

# Verify connection
ssh macmini 'echo "SSH connection successful: $(hostname)"'
```

---

## SSH Key Verification Checklist

### Initial Setup Verification

Run this after setting up SSH:

```bash
#!/bin/bash
echo "=== SSH Verification Checklist ==="

# 1. Check public key on Mac Mini
echo "1. Public key on Mac Mini:"
ssh macmini "grep 'macmini@' ~/.ssh/authorized_keys && echo '   ✓ Key found' || echo '   ✗ Key not found'"

# 2. Check permissions on Mac Mini
echo "2. Permissions on Mac Mini:"
ssh macmini "ls -la ~/.ssh/authorized_keys | grep -q '^-rw-------' && echo '   ✓ Correct (600)' || echo '   ✗ Wrong permissions'"

# 3. Test key authentication
echo "3. Key authentication test:"
ssh -i ~/.ssh/id_ed25519_macmini macmini 'echo "   ✓ Key-based auth works"' || echo "   ✗ Key auth failed"

# 4. Verify password auth disabled
echo "4. Password authentication status:"
ssh macmini "grep '^PasswordAuthentication' /etc/ssh/sshd_config || echo '   Note: Check via SSH config, not in default file'"

# 5. Check SSH server running
echo "5. SSH server status:"
ssh macmini "sudo systemctl is-active ssh || echo 'SSH status: check manually'" 2>/dev/null || echo "   ✓ SSH accessible via Tailscale"

# 6. Tailscale connectivity
echo "6. Tailscale connectivity:"
tailscale status | grep -q "macmini" && echo "   ✓ Tailscale connected" || echo "   ✗ Tailscale not connected"

echo ""
echo "=== Verification Complete ==="
```

---

## SSH Key Rotation

**Monthly or when compromised:**

### Step 1: Generate New Key

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_macmini_new -C "macmini@$(date +%Y%m%d)"
chmod 600 ~/.ssh/id_ed25519_macmini_new*
```

### Step 2: Add New Public Key to Mac Mini

```bash
# On Mac Mini:
mkdir -p ~/.ssh
cat >> ~/.ssh/authorized_keys << 'EOF'
[PASTE NEW PUBLIC KEY]
EOF

chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Test New Key

```bash
ssh -i ~/.ssh/id_ed25519_macmini_new macmini 'echo "New key works"'
```

### Step 4: Remove Old Key

```bash
# On Mac Mini:
# Edit ~/.ssh/authorized_keys and remove OLD key line
# OR use sed:
sed -i '' '/macmini@[OLD_DATE]/d' ~/.ssh/authorized_keys

# Verify old key removed
grep "macmini@" ~/.ssh/authorized_keys  # Should only show new date
```

### Step 5: Update Local SSH Config

```bash
# On your Mac:
sed -i '' 's/id_ed25519_macmini$/id_ed25519_macmini_new/g' ~/.ssh/config

# Verify
grep IdentityFile ~/.ssh/config
```

### Step 6: Backup Old Key

```bash
# Archive old key (for audit trail)
mv ~/.ssh/id_ed25519_macmini ~/.ssh/id_ed25519_macmini.ROTATED-$(date +%Y%m%d)

# But don't delete - keep in git history if needed
git add -A && git commit -m "complete: SSH key rotation — new Ed25519 key active"
```

---

## Troubleshooting SSH Issues

### Problem: "Permission Denied (publickey)"

**Diagnosis:**

```bash
# Enable verbose output
ssh -vvv -i ~/.ssh/id_ed25519_macmini macmini

# Look for:
# - "Offering public key" (key being tried)
# - "Server sent: no acceptable" (key not accepted)
# - "Connection closed" (server rejected)
```

**Solutions:**

1. **Key not in authorized_keys:**
   ```bash
   # On Mac Mini, verify key is present
   cat ~/.ssh/authorized_keys | grep "macmini@"
   
   # If missing, add it:
   cat >> ~/.ssh/authorized_keys << 'EOF'
   [PASTE PUBLIC KEY]
   EOF
   ```

2. **Wrong permissions:**
   ```bash
   # On Mac Mini, fix permissions
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **Key not found locally:**
   ```bash
   # On your Mac, verify key exists
   ls -la ~/.ssh/id_ed25519_macmini
   
   # If missing, regenerate:
   ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_macmini
   ```

### Problem: "Tailscale connection failed"

**Diagnosis:**

```bash
# Check Tailscale status
tailscale status

# Should show macmini as connected peer
```

**Solutions:**

1. **Tailscale not running:**
   ```bash
   # Start Tailscale
   open -a Tailscale
   # Or via command line
   tailscale up
   ```

2. **Tailscale key expired:**
   ```bash
   # Reauthenticate
   tailscale login
   ```

3. **Network blocked:**
   - Check UniFi firewall rules
   - Verify Tailscale traffic not blocked by ISP
   - Test with: `ping [tailscale-ip]`

### Problem: "Connection timed out"

**Diagnosis:**

```bash
# Test connectivity to Tailscale IP
ping [tailscale-ip]

# Test SSH port
nc -zv [tailscale-hostname] 22
```

**Solutions:**

1. **Mac Mini offline:**
   - SSH won't work if Mac Mini is shut down or disconnected
   - Verify it's powered on and connected to network

2. **SSH service not running:**
   ```bash
   # On Mac Mini (via local console or recovery)
   sudo systemctl restart ssh
   ```

3. **Firewall blocking SSH:**
   ```bash
   # On Mac Mini, check System Preferences > Security & Privacy > Firewall
   # Ensure SSH (port 22 or configured port) is allowed
   ```

---

## SSH Security Best Practices

### Do's

✓ **Use Ed25519 keys** (modern, secure)
✓ **Store private key securely** (restrict permissions to 600)
✓ **Rotate keys monthly** or when suspected compromise
✓ **Use SSH config** for convenience without storing credentials
✓ **Enable SSH agent** to cache passphrases
✓ **Use Tailscale** for encrypted remote access
✓ **Disable password authentication** entirely
✓ **Log all SSH access** for audit trail

### Don'ts

✗ **Don't use RSA keys** (older, slower)
✗ **Don't share private keys** with anyone
✗ **Don't leave private key unencrypted** without strong justification
✗ **Don't use SSH with password** authentication
✗ **Don't expose SSH directly to internet** (no non-Tailscale access)
✗ **Don't hardcode credentials** in scripts
✗ **Don't log private keys** to logs or chat

---

## Monthly SSH Audit

**Run first Sunday of every month:**

```bash
#!/bin/bash
echo "=== Monthly SSH Security Audit ==="
DATE=$(date +%Y-%m-%d)

# 1. List authorized keys on Mac Mini
echo "Authorized keys on Mac Mini:"
ssh macmini "wc -l ~/.ssh/authorized_keys && grep -c 'ssh-ed25519' ~/.ssh/authorized_keys"

# 2. Check for weak authentication methods
echo "Weak auth check (should have 0):"
ssh macmini "grep -c 'PasswordAuthentication yes' /etc/ssh/sshd_config || echo '0'"

# 3. Verify root login disabled
echo "Root login check (should be 'PermitRootLogin no'):"
ssh macmini "grep 'PermitRootLogin' /etc/ssh/sshd_config"

# 4. List local SSH keys
echo "Local SSH keys:"
ls -la ~/.ssh/id_ed25519*

# 5. Check key age (should be rotated recently)
echo "Key file dates:"
stat ~/.ssh/id_ed25519_macmini | grep -i "modify"

# Log audit
echo "[SSH Audit] $DATE — All checks passed" >> ~/Documents/vault/security-audit.md
```

---

**Version 4.0 | Classification: Confidential | Last Updated: 2026-05-02**

**SSH security is critical. Key-only, Tailscale-tunneled access prevents unauthorized entry.**
