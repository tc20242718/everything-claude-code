#!/usr/bin/env node
/**
 * Tests for macmini-audit.sh
 *
 * Strategy: shim out external binaries (openclaw, ollama, curl, brew, launchctl,
 * python3, ps) via a temp PATH directory and assert on the script's stdout +
 * exit code for each scenario.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const scriptPath = path.join(__dirname, '..', '..', 'macmini-audit.sh');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
    return true;
  } catch (error) {
    console.log(`FAIL: ${name}`);
    console.log(`  ${error.message}`);
    return false;
  }
}

function makeShimDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'audit-shim-'));
}

function writeShim(dir, name, body) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `#!/bin/bash\n${body}\n`);
  fs.chmodSync(file, 0o755);
}

function runAudit(shimDir, extraEnv = {}) {
  return spawnSync('bash', [scriptPath], {
    env: {
      // Keep PATH so basics like awk/grep/sed/cut work, but prepend shimDir.
      PATH: `${shimDir}:${process.env.PATH}`,
      HOME: extraEnv.HOME || fs.mkdtempSync(path.join(os.tmpdir(), 'audit-home-')),
      ...extraEnv,
    },
    encoding: 'utf8',
  });
}

function defaultShims(dir, opts = {}) {
  // brew (present)
  writeShim(dir, 'brew', `echo "Homebrew 4.0.0"`);
  // python3: Python 3.11.0
  writeShim(dir, 'python3', `
case "$1" in
  --version) echo "Python ${opts.pyVersion || '3.11.0'}";;
  -c) exit 0 ;;  # venv import succeeds
  *) ;;
esac
`);
  // launchctl
  writeShim(dir, 'launchctl', `echo "no service"`);
  // curl: by default reaches Ollama tags endpoint
  writeShim(dir, 'curl', `
case "$*" in
  *tags*) echo '{"models":[{"name":"qwen3:14b"},{"name":"llama3.1:8b"}]}'; exit 0 ;;
  *) exit 0 ;;
esac
`);
  // ps: emit Ollama process count via OLLAMA_PROCS env var
  writeShim(dir, 'ps', `
# Emit ${opts.ollamaProcs || 0} fake ollama lines plus standard noise
echo "USER PID COMMAND"
i=0
while [ $i -lt ${opts.ollamaProcs || 0} ]; do
  echo "user $((100+i)) /usr/local/bin/ollama serve"
  i=$((i+1))
done
echo "user 1 /sbin/init"
`);
  if (opts.openclaw) {
    writeShim(dir, 'openclaw', `
case "$1 $2" in
  "health ")
    cat <<'OUT'
${opts.openclawHealth || 'telegram: connected\nAgents: 1 ready'}
OUT
    ;;
  "config get")
    case "$3" in
      channels.telegram.dmPolicy) echo "${opts.dmPolicy || 'allowlist'}" ;;
      *) echo "" ;;
    esac
    ;;
  *) ;;
esac
`);
  }
}

let passed = 0;
let failed = 0;

if (test('clean environment with no Ollama and no openclaw passes basic checks', () => {
  const dir = makeShimDir();
  defaultShims(dir, { ollamaProcs: 0, openclaw: false });
  const result = runAudit(dir);
  assert.match(result.stdout, /Homebrew installed/, 'brew detected');
  assert.match(result.stdout, /Python 3 installed/, 'python detected');
  assert.match(result.stdout, /Ollama not running/, 'should warn when 0 processes');
  assert.match(result.stdout, /openclaw CLI not found/, 'should note missing openclaw');
})) passed++; else failed++;

if (test('detects multiple Ollama processes as a critical issue', () => {
  const dir = makeShimDir();
  defaultShims(dir, { ollamaProcs: 3, openclaw: false });
  const result = runAudit(dir);
  assert.match(result.stdout, /Multiple Ollama processes detected/, 'must flag duplicate processes');
  assert.match(result.stdout, /pkill -f ollama/, 'must include the fix command');
  assert.notStrictEqual(result.status, 0, 'exit code must be non-zero on issues');
})) passed++; else failed++;

if (test('single Ollama process is reported as healthy', () => {
  const dir = makeShimDir();
  defaultShims(dir, { ollamaProcs: 1, openclaw: false });
  const result = runAudit(dir);
  assert.match(result.stdout, /Ollama: single process running/, 'single proc is healthy');
  assert.doesNotMatch(result.stdout, /Multiple Ollama processes/);
})) passed++; else failed++;

if (test('flags dmPolicy=pairing as critical with the documented fix', () => {
  const dir = makeShimDir();
  defaultShims(dir, { ollamaProcs: 1, openclaw: true, dmPolicy: 'pairing' });
  const result = runAudit(dir);
  assert.match(result.stdout, /dmPolicy=pairing: plain text messages will be ignored/);
  assert.match(result.stdout, /openclaw config set channels\.telegram\.dmPolicy allowlist/);
  assert.match(result.stdout, /openclaw gateway --force/);
  assert.notStrictEqual(result.status, 0, 'must fail audit when dmPolicy is pairing');
})) passed++; else failed++;

if (test('passes when dmPolicy=allowlist', () => {
  const dir = makeShimDir();
  defaultShims(dir, { ollamaProcs: 1, openclaw: true, dmPolicy: 'allowlist' });
  const result = runAudit(dir);
  assert.match(result.stdout, /dmPolicy: allowlist/);
  assert.doesNotMatch(result.stdout, /plain text messages will be ignored/);
})) passed++; else failed++;

if (test('detects 401 Unauthorized in OpenClaw health output', () => {
  const dir = makeShimDir();
  defaultShims(dir, {
    ollamaProcs: 1,
    openclaw: true,
    openclawHealth: 'telegram: failed (401)\nAgents: 1 ready',
    dmPolicy: 'allowlist',
  });
  const result = runAudit(dir);
  assert.match(result.stdout, /Telegram channel: 401 Unauthorized/);
  assert.match(result.stdout, /openclaw configure/);
  assert.notStrictEqual(result.status, 0, 'must fail when telegram returns 401');
})) passed++; else failed++;

if (test('reports gateway running on port 18789 (not legacy 8000)', () => {
  const dir = makeShimDir();
  defaultShims(dir, { ollamaProcs: 1, openclaw: true, dmPolicy: 'allowlist' });
  const result = runAudit(dir);
  assert.match(result.stdout, /OpenClaw gateway running on localhost:18789/);
  assert.doesNotMatch(result.stdout, /:8000/, 'must not reference the legacy port');
})) passed++; else failed++;

if (test('warns when openclaw is missing instead of crashing', () => {
  const dir = makeShimDir();
  defaultShims(dir, { ollamaProcs: 1, openclaw: false });
  const result = runAudit(dir);
  assert.match(result.stdout, /openclaw CLI not found/);
  // Missing openclaw alone should not be a hard fail
  assert.doesNotMatch(result.stdout, /Multiple Ollama|dmPolicy=pairing|401 Unauthorized/);
})) passed++; else failed++;

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
