#!/usr/bin/env node

/**
 * MacMini-AI-Coach Audit Script
 * Non-destructive environment verification and delta reporting
 *
 * Version: 4.0
 * Usage: node audit.js OR bash ~/macmini-audit.sh (wrapper)
 *
 * Cross-platform: macOS, Linux, Windows (via Node.js)
 * Optimized for: Apple M-series (arm64)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MacMiniAudit {
  constructor() {
    this.checks = [];
    this.blockers = [];
    this.warnings = [];
    this.timestamp = new Date().toISOString();
  }

  // Utility: Safe command execution
  run(cmd, desc = '') {
    try {
      return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch (e) {
      if (desc) this.warning(`${desc}: ${e.message}`);
      return null;
    }
  }

  // Utility: Check if port is responding
  checkPort(port, name) {
    const result = this.run(`curl -s http://localhost:${port}/health 2>/dev/null | head -1`);
    if (result && result.includes('{')) {
      this.pass(`${name} responding on :${port}`);
      return true;
    }
    this.blocker(`${name} NOT responding on :${port}`);
    return false;
  }

  // Report methods
  pass(msg) {
    this.checks.push({ status: 'PASS', msg });
    console.log(`✓ ${msg}`);
  }

  warning(msg) {
    this.warnings.push(msg);
    console.log(`⚠ WARNING: ${msg}`);
  }

  blocker(msg) {
    this.blockers.push(msg);
    console.log(`✗ BLOCKER: ${msg}`);
  }

  // Hardware verification
  auditHardware() {
    console.log('\n=== Hardware Verification ===');

    // CPU
    const cpu = this.run('sysctl -n machdep.cpu.brand_string', 'CPU check');
    if (cpu && cpu.includes('Apple')) {
      this.pass(`CPU: ${cpu}`);
    } else {
      this.warning('CPU: Not Apple Silicon or unable to verify');
    }

    // Memory
    const memBytes = this.run('sysctl -n hw.memsize', 'Memory check');
    if (memBytes) {
      const memGB = Math.round(parseInt(memBytes) / 1024 / 1024 / 1024);
      if (memGB >= 24) {
        this.pass(`Memory: ${memGB} GB (adequate)`);
      } else {
        this.warning(`Memory: ${memGB} GB (minimum 24 GB recommended)`);
      }
    }

    // Storage
    const storage = this.run('df -h / | tail -1 | awk \'{print $2}\'', 'Storage check');
    if (storage) {
      this.pass(`Storage: ${storage} available`);
    }

    // Uptime
    const uptime = this.run('uptime', 'Uptime check');
    if (uptime) {
      this.pass(`System uptime: ${uptime.split('up')[1]?.split(',')[0]?.trim() || 'unknown'}`);
    }
  }

  // Agent stack verification
  auditAgentStack() {
    console.log('\n=== Agent Stack Health Check ===');

    // NemoClaw (CRITICAL)
    const nemoClaw = this.checkPort(9100, 'NemoClaw');
    if (!nemoClaw) {
      this.blocker('Privacy enforcement offline - all operations blocked');
    }

    // Ollama
    const ollama = this.run('curl -s http://localhost:11434/api/tags 2>/dev/null | jq -r \'.models | length\'');
    if (ollama && parseInt(ollama) > 0) {
      this.pass(`Ollama: ${ollama} models loaded`);
    } else {
      this.warning('Ollama: No models loaded or not responding');
    }

    // OpenClaw
    this.checkPort(8000, 'OpenClaw');

    // Hermes
    this.checkPort(9000, 'Hermes');
  }

  // Security posture verification
  auditSecurity() {
    console.log('\n=== Security Posture ===');

    // web-search plugin disabled (known vulnerability)
    const pluginsDir = path.expand('~/.openclaw/plugins');
    if (fs.existsSync(pluginsDir)) {
      const plugins = fs.readdirSync(pluginsDir);
      if (plugins.includes('openclaw-web-search')) {
        this.blocker('web-search plugin enabled - known egress vulnerability. DISABLE IMMEDIATELY.');
      } else {
        this.pass('web-search plugin: disabled');
      }
    } else {
      this.pass('web-search plugin: directory not found (OK)');
    }

    // Ollama network binding (localhost-only)
    const ollama_binding = this.run('lsof -i :11434 2>/dev/null | grep LISTEN');
    if (ollama_binding && ollama_binding.includes('127.0.0.1')) {
      this.pass('Ollama: bound to localhost only (secure)');
    } else if (ollama_binding && ollama_binding.includes('0.0.0.0')) {
      this.blocker('Ollama: exposed to 0.0.0.0 (network accessible)');
    } else {
      this.warning('Ollama: unable to verify binding');
    }

    // LuLu firewall
    const luluRunning = this.run('pgrep -x LuLu');
    if (luluRunning) {
      this.pass('LuLu firewall: active');
    } else {
      this.warning('LuLu firewall: not running. Start in System Settings > Security & Privacy');
    }

    // No hardcoded credentials in code
    const credsCheck = this.run(
      'grep -r "password\\|api.key\\|token" ~/.openclaw 2>/dev/null | grep -v ".git" | wc -l'
    );
    if (credsCheck === '0') {
      this.pass('Code scanning: no hardcoded credentials found');
    } else if (credsCheck && parseInt(credsCheck) > 0) {
      this.blocker(`Found ${credsCheck} potential credential exposures in code`);
    }
  }

  // Configuration verification
  auditConfiguration() {
    console.log('\n=== Configuration Files ===');

    const requiredFiles = [
      { path: '~/.openclaw/cost_tracker.sql', name: 'Cost tracker database' },
      { path: '~/.claude/config/llm-routing.yaml', name: 'LLM routing config' },
      { path: '~/CLAUDE.md', name: 'Session rules (CLAUDE.md)' },
      { path: '~/Documents/vault', name: 'Obsidian vault' },
      { path: '~/outputs', name: 'Master artifacts directory' }
    ];

    for (const file of requiredFiles) {
      const expandedPath = file.path.replace('~', process.env.HOME);
      if (fs.existsSync(expandedPath)) {
        this.pass(`${file.name}: present`);
      } else {
        this.warning(`${file.name}: not found at ${file.path}`);
      }
    }
  }

  // Network verification
  auditNetwork() {
    console.log('\n=== Network Connectivity ===');

    // Internet
    const internet = this.run('ping -c 1 8.8.8.8 2>/dev/null');
    if (internet) {
      this.pass('Internet: reachable');
    } else {
      this.warning('Internet: not reachable or ping blocked');
    }

    // Tailscale
    const tailscale = this.run('tailscale status 2>/dev/null | grep -i online');
    if (tailscale && tailscale.includes('online')) {
      this.pass('Tailscale: connected');
    } else {
      this.warning('Tailscale: not connected or not installed');
    }
  }

  // Git repository verification
  auditGit() {
    console.log('\n=== Git Repository ===');

    const outputsDir = path.join(process.env.HOME, 'outputs');
    if (!fs.existsSync(outputsDir)) {
      this.warning('~/outputs directory not found (not critical)');
      return;
    }

    const commitCount = this.run(`cd ${outputsDir} && git log --oneline 2>/dev/null | wc -l`);
    if (commitCount && parseInt(commitCount) > 0) {
      this.pass(`Git history: ${commitCount} commits`);
    } else {
      this.warning('Git repository: not initialized or no commits');
    }

    // Check for uncommitted changes
    const status = this.run(`cd ${outputsDir} && git status --short 2>/dev/null`);
    if (status && status.length === 0) {
      this.pass('Git working tree: clean');
    } else if (status) {
      this.warning(`Git: ${status.split('\n').length} uncommitted files`);
    }
  }

  // Backup verification
  auditBackup() {
    console.log('\n=== Backup Status ===');

    // iCloud ADP
    const obsidianSync = this.run('ls -lt ~/Documents/vault/.obsidian/sync.json 2>/dev/null | awk \'{print $6, $7, $8}\'');
    if (obsidianSync) {
      this.pass(`iCloud Obsidian sync: last updated ${obsidianSync}`);
    } else {
      this.warning('iCloud Obsidian sync: unable to verify');
    }

    // Proton Drive
    const protonDir = path.join(process.env.HOME, 'Proton Drive');
    if (fs.existsSync(protonDir)) {
      const backupFiles = this.run(`ls -1 "${protonDir}"/macmini-backup-*.tar.gz 2>/dev/null | wc -l`);
      if (backupFiles && parseInt(backupFiles) > 0) {
        this.pass(`Proton Drive: ${backupFiles} backup file(s) present`);
      } else {
        this.warning('Proton Drive: no backup files found');
      }
    } else {
      this.warning('Proton Drive directory not found');
    }
  }

  // Full audit execution
  run() {
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║         MacMini-AI-Coach Audit Report                      ║`);
    console.log(`║         Generated: ${this.timestamp}                    ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);

    this.auditHardware();
    this.auditAgentStack();
    this.auditSecurity();
    this.auditConfiguration();
    this.auditNetwork();
    this.auditGit();
    this.auditBackup();

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log(`║ SUMMARY: ${this.checks.length} checks passed, ${this.warnings.length} warnings, ${this.blockers.length} blockers ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);

    if (this.blockers.length > 0) {
      console.log('\n⚠ CRITICAL BLOCKERS (must fix before operations):');
      this.blockers.forEach(b => console.log(`  • ${b}`));
      process.exit(1);
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠ WARNINGS (should address):');
      this.warnings.forEach(w => console.log(`  • ${w}`));
    }

    if (this.blockers.length === 0) {
      console.log('\n✓ All critical checks passed. Ready for operations.');
      process.exit(0);
    }
  }
}

// Utility function: expand ~ to home directory
String.prototype.expand = function() {
  return this.replace(/^~/, process.env.HOME);
};

// Run audit
const audit = new MacMiniAudit();
audit.run();
