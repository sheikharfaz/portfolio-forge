/**
 * Gate — build and budgets.
 *
 * Runs the template's own build with the injected profile, then holds the
 * output to the ceilings the template declared. A template that quietly grows
 * past its budget fails here, in this repo, rather than as a slow site on
 * somebody's domain.
 */

import { spawn } from 'node:child_process';
import { stat, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

import { finding, pass, fail, SEVERITY } from '../lib/report.mjs';

export function run(command, args, cwd, { timeout = 600_000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      env: { ...process.env, CI: 'true', NODE_ENV: 'production' },
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ code: 124, stdout, stderr: stderr + `\n[harness] killed after ${timeout}ms` });
    }, timeout);

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ code: 127, stdout, stderr: String(err) });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

async function dirSize(dir, filter = () => true) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) total += await dirSize(full, filter);
    else if (filter(full)) total += (await stat(full)).size;
  }
  return total;
}

export async function checkBuild(templateDir, manifest) {
  const outDir = join(templateDir, manifest.outDir || 'dist');

  const install = await run('npm', ['ci', '--no-audit', '--no-fund'], templateDir);
  if (install.code !== 0) {
    return fail('build', finding({
      gate: 'build',
      where: `${templateDir} — npm ci`,
      message: install.stderr.trim().split('\n').slice(-15).join('\n'),
      fix: 'The lockfile is out of sync with package.json, or a pinned version was unpublished. Templates pin exact versions for exactly this reason.',
    }));
  }

  const [cmd, ...args] = (manifest.buildCommand || 'npm run build').split(' ');
  const build = await run(cmd, args, templateDir);
  if (build.code !== 0) {
    return fail('build', finding({
      gate: 'build',
      where: `${templateDir} — ${manifest.buildCommand}`,
      message: (build.stderr || build.stdout).trim().split('\n').slice(-25).join('\n'),
      fix: 'Read the compiler output above. If it names a profile field, the profile shape and the template disagree — fix the template, not the schema.',
    }));
  }

  const findings = [];
  const budget = manifest.budgets?.maxBundleKb;
  if (budget) {
    const jsCss = await dirSize(outDir, (f) => ['.js', '.css'].includes(extname(f)));
    const kb = Math.round(jsCss / 1024);
    if (kb > budget) {
      findings.push(finding({
        gate: 'build',
        where: `${templateDir} — bundle size`,
        message: `${kb}KB of JS+CSS against a declared budget of ${budget}KB.`,
        fix: 'Code-split the heavy path (the WebGL stack is the usual culprit) or raise the budget deliberately in template.json.',
      }));
    }
  }

  const total = await dirSize(outDir);
  if (total > 100 * 1024 * 1024) {
    findings.push(finding({
      gate: 'build',
      severity: SEVERITY.WARN,
      where: `${templateDir} — output size`,
      message: `${Math.round(total / 1024 / 1024)}MB of build output.`,
      fix: 'GitHub Pages soft-limits published sites at 1GB and warns well before that. Compress or drop large media.',
    }));
  }

  return findings.length ? fail('build', findings) : pass('build');
}
