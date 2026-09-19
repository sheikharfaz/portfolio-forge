#!/usr/bin/env node
/**
 * Phase 0 — check the tools before asking the user anything.
 *
 * Failing here costs two minutes. Failing at the deploy step costs the whole
 * run, after they have already answered every question.
 *
 *   node scripts/preflight.mjs [--json]
 */

import { spawn } from 'node:child_process';

const sh = (cmd, args) =>
  new Promise((resolve) => {
    const child = spawn(cmd, args, { shell: false });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => (stdout += d));
    child.stderr?.on('data', (d) => (stderr += d));
    child.on('error', () => resolve({ ok: false, stdout: '', stderr: 'not found' }));
    child.on('close', (code) => resolve({ ok: code === 0, stdout: stdout.trim(), stderr: stderr.trim() }));
  });

const atLeast = (actual, required) => {
  const a = actual.split('.').map(Number);
  const r = required.split('.').map(Number);
  for (let i = 0; i < r.length; i++) {
    if ((a[i] ?? 0) > (r[i] ?? 0)) return true;
    if ((a[i] ?? 0) < (r[i] ?? 0)) return false;
  }
  return true;
};

const checks = [];
const add = (name, ok, detail, fix) => checks.push({ name, ok, detail, fix });

// Node
const nodeVersion = process.versions.node;
add('node', atLeast(nodeVersion, '20.11.0'), `v${nodeVersion}`,
  'Install Node 20.11 or newer: https://nodejs.org — templates pin their toolchain and will not build below this.');

// git
const git = await sh('git', ['--version']);
add('git', git.ok, git.ok ? git.stdout : 'not found', 'Install git: https://git-scm.com/downloads');

// gh — the one that actually blocks deployment
const gh = await sh('gh', ['--version']);
if (!gh.ok) {
  add('gh', false, 'not found',
    'Install the GitHub CLI: https://cli.github.com (brew install gh / winget install GitHub.cli), then run: gh auth login');
} else {
  const auth = await sh('gh', ['auth', 'status']);
  if (!auth.ok) {
    add('gh auth', false, 'not authenticated', 'Run: gh auth login  (choose HTTPS and authenticate in the browser)');
  } else {
    const scopes = `${auth.stdout}\n${auth.stderr}`;
    const hasRepo = /['\s,]repo[',\s]/.test(scopes);
    const hasWorkflow = /workflow/.test(scopes);
    add('gh auth', hasRepo && hasWorkflow,
      hasRepo && hasWorkflow ? 'authenticated with repo + workflow' : 'missing scopes',
      'Creating a repo and enabling Pages needs both: gh auth refresh -h github.com -s repo,workflow');

    const login = await sh('gh', ['api', 'user', '--jq', '.login']);
    if (login.ok) add('github account', true, login.stdout, null);
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ ok: checks.every((c) => c.ok), checks }, null, 2));
} else {
  for (const c of checks) {
    console.log(`${c.ok ? '  ok' : 'FAIL'}  ${c.name.padEnd(16)} ${c.detail}`);
    if (!c.ok && c.fix) console.log(`        → ${c.fix}`);
  }
}

process.exit(checks.every((c) => c.ok) ? 0 : 1);
