#!/usr/bin/env node
/**
 * Proves the link the harness cannot: that a staged site is a standalone
 * repository which builds on a clean machine the way GitHub Actions will
 * build it.
 *
 *   node scripts/smoke-stage.mjs --template templates/minimal --fixture schema/fixtures/full.json
 *
 * The harness verifies the template plus a profile. This verifies what the
 * user actually receives, which is a different artefact — different files,
 * different base path, no Forge tooling to fall back on.
 */

import { readFile, mkdtemp, rm, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve, join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { stageSite } from './lib/stage.mjs';
import { green, red, dim } from '../harness/lib/report.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));
const exists = (p) => access(p).then(() => true, () => false);

const run = (cmd, args, cwd) =>
  new Promise((res) => {
    const child = spawn(cmd, args, { cwd, shell: false });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('error', (e) => res({ code: 127, out: String(e) }));
    child.on('close', (code) => res({ code, out }));
  });

function fail(message, detail) {
  console.error(`\n${red('FAIL')}  ${message}`);
  if (detail) console.error(dim(detail));
  process.exit(1);
}

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, token, i, all) => {
    if (token.startsWith('--')) acc.push([token.slice(2), all[i + 1]]);
    return acc;
  }, [])
);

if (!args.template || !args.fixture) {
  console.error('usage: smoke-stage.mjs --template templates/<name> --fixture schema/fixtures/<name>.json');
  process.exit(2);
}

const templateDir = resolve(args.template);
const manifest = await readJson(join(templateDir, 'template.json'));
const profile = await readJson(resolve(args.fixture));

profile.site.template = manifest.name;
profile.site.repoName = 'smoke-test-site';
// The shared fixture assets cover the avatar and OG image, not project media.
for (const project of profile.projects ?? []) delete project.media;

const workDir = await mkdtemp(join(tmpdir(), 'forge-smoke-'));
const outDir = join(workDir, 'site');

try {
  const { missingAssets } = await stageSite({
    templateDir,
    profile,
    outDir,
    assetsDir: join(ROOT, 'schema', 'fixtures', 'assets'),
  });

  if (missingAssets.length) {
    fail(`staged site is missing assets it references: ${missingAssets.join(', ')}`);
  }

  // A staged site must install from its own committed lockfile. If it cannot,
  // neither can the workflow it ships with.
  const install = await run('npm', ['ci', '--no-audit', '--no-fund'], outDir);
  if (install.code !== 0) fail('npm ci failed in the staged site', install.out.split('\n').slice(-15).join('\n'));

  // Build exactly as the shipped workflow does for a project site.
  const build = await run('npm', ['run', 'build'], outDir);
  if (build.code !== 0) fail('the staged site does not build', build.out.split('\n').slice(-20).join('\n'));

  const outPath = join(outDir, manifest.outDir || 'dist');
  const indexHtml = await readFile(join(outPath, 'index.html'), 'utf8');

  // The two failures that produce a blank page on a real Pages deploy.
  if (!(await exists(join(outPath, '404.html')))) {
    fail('no 404.html in the build output', 'Client-side routes break on refresh without it.');
  }

  // Then again as a project site, which is what the overwhelming majority of
  // published sites are.
  const based = await new Promise((res) => {
    const child = spawn('npm', ['run', 'build'], {
      cwd: outDir,
      shell: false,
      env: { ...process.env, FORGE_BASE_PATH: '/smoke-test-site/' },
    });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => res({ code, out }));
  });
  if (based.code !== 0) fail('build with a base path failed', based.out);

  const basedHtml = await readFile(join(outPath, 'index.html'), 'utf8');
  if (!basedHtml.includes('/smoke-test-site/assets/')) {
    fail(
      'FORGE_BASE_PATH was not applied to the asset URLs',
      'A project site is served from /<repo>/. Without this the published page loads no CSS and no JS — ' +
        'the single most common way these deploys fail.\n\n' +
        basedHtml.split('\n').filter((l) => l.includes('src=') || l.includes('href=')).join('\n')
    );
  }

  console.log(`${green('PASS')}  ${manifest.name} stages into a standalone site that builds with a base path`);
  console.log(dim(`      root build: ${indexHtml.length} bytes · based build resolves /smoke-test-site/assets/`));
} finally {
  await rm(workDir, { recursive: true, force: true });
}
