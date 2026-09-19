import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, mkdtemp, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { stageSite, referencedAssets } from '../../scripts/lib/stage.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const TEMPLATE = join(ROOT, 'templates', 'minimal');

const exists = (p) => access(p).then(() => true, () => false);
const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));

async function stageFixture(mutate = (p) => p) {
  const profile = mutate(await readJson(join(ROOT, 'schema', 'fixtures', 'full.json')));
  profile.site.template = 'minimal';
  const dir = join(await mkdtemp(join(tmpdir(), 'forge-test-')), profile.site.repoName);
  const result = await stageSite({ templateDir: TEMPLATE, profile, outDir: dir });
  return { dir, profile, result };
}

test('stages a buildable site', async (t) => {
  const { dir } = await stageFixture();
  t.after(() => rm(dir, { recursive: true, force: true }));

  for (const file of ['package.json', 'package-lock.json', 'vite.config.js', 'index.html', 'src/main.jsx', 'src/App.jsx']) {
    assert.ok(await exists(join(dir, file)), `expected ${file}`);
  }
});

test('the profile is the staged site content source', async (t) => {
  const { dir, profile } = await stageFixture();
  t.after(() => rm(dir, { recursive: true, force: true }));

  const staged = await readJson(join(dir, 'src', 'profile.json'));
  assert.equal(staged.identity.name, profile.identity.name);
  assert.equal(staged.projects.length, profile.projects.length);
});

test('no Forge machinery reaches the user repo', async (t) => {
  const { dir } = await stageFixture();
  t.after(() => rm(dir, { recursive: true, force: true }));

  // These are ours, not theirs. A template.json in someone's portfolio repo is
  // confusing at best and edited-with-no-effect at worst.
  for (const leaked of ['template.json', 'preview.png', 'node_modules', 'dist']) {
    assert.equal(await exists(join(dir, leaked)), false, `${leaked} leaked into the staged site`);
  }
});

test('the deploy workflow is carried through', async (t) => {
  const { dir } = await stageFixture();
  t.after(() => rm(dir, { recursive: true, force: true }));

  const workflow = await readFile(join(dir, '.github', 'workflows', 'deploy.yml'), 'utf8');
  assert.match(workflow, /actions\/deploy-pages/);
  // The base path is what makes a project site render at all.
  assert.match(workflow, /FORGE_BASE_PATH/);
});

test('a custom domain is committed as a CNAME', async (t) => {
  const { dir } = await stageFixture((p) => {
    p.site.domain = 'portfolio.example.com';
    return p;
  });
  t.after(() => rm(dir, { recursive: true, force: true }));

  // Setting the domain through the API alone is forgotten on the next deploy.
  assert.equal((await readFile(join(dir, 'public', 'CNAME'), 'utf8')).trim(), 'portfolio.example.com');
});

test('no CNAME when no domain was asked for', async (t) => {
  const { dir } = await stageFixture();
  t.after(() => rm(dir, { recursive: true, force: true }));
  assert.equal(await exists(join(dir, 'public', 'CNAME')), false);
});

test('the site README tells the owner how to maintain it', async (t) => {
  const { dir } = await stageFixture();
  t.after(() => rm(dir, { recursive: true, force: true }));

  const readme = await readFile(join(dir, 'README.md'), 'utf8');
  assert.match(readme, /src\/profile\.json/);
  assert.match(readme, /npm run dev/);
});

test('refuses to clobber an existing directory unless forced', async (t) => {
  const { dir, profile } = await stageFixture();
  t.after(() => rm(dir, { recursive: true, force: true }));

  await assert.rejects(
    () => stageSite({ templateDir: TEMPLATE, profile, outDir: dir }),
    /already exists/
  );
  await assert.doesNotReject(() => stageSite({ templateDir: TEMPLATE, profile, outDir: dir, force: true }));
});

test('an asset the profile promises but nothing ships is reported', async (t) => {
  const { dir, result } = await stageFixture();
  t.after(() => rm(dir, { recursive: true, force: true }));

  // full.json references an avatar, an OG image and project media; none of
  // them exist without an assets directory.
  assert.ok(result.missingAssets.includes('images/avatar.svg'));
  assert.ok(result.missingAssets.includes('images/og.svg'));
  assert.ok(result.missingAssets.includes('images/quorum.webp'));
});

test('supplying the assets directory resolves them', async (t) => {
  const profile = await readJson(join(ROOT, 'schema', 'fixtures', 'full.json'));
  profile.site.template = 'minimal';
  // Keep only the assets the shared fixture placeholders actually provide.
  delete profile.projects[0].media;

  const dir = join(await mkdtemp(join(tmpdir(), 'forge-test-')), 'assets-site');
  t.after(() => rm(dir, { recursive: true, force: true }));

  const result = await stageSite({
    templateDir: TEMPLATE,
    profile,
    outDir: dir,
    assetsDir: join(ROOT, 'schema', 'fixtures', 'assets'),
  });

  assert.deepEqual(result.missingAssets, []);
  assert.ok(await exists(join(dir, 'public', 'images', 'avatar.svg')));
});

test('remote assets are somebody else’s uptime, not a staging failure', async (t) => {
  const profile = await readJson(join(ROOT, 'schema', 'fixtures', 'full.json'));
  profile.site.template = 'minimal';
  profile.identity.avatar.src = 'https://example.com/avatar.png';
  delete profile.seo.ogImage;
  delete profile.projects[0].media;

  const dir = join(await mkdtemp(join(tmpdir(), 'forge-test-')), 'remote-site');
  t.after(() => rm(dir, { recursive: true, force: true }));

  const result = await stageSite({ templateDir: TEMPLATE, profile, outDir: dir });
  assert.deepEqual(result.missingAssets, []);
});
