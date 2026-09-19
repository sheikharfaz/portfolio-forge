#!/usr/bin/env node
/**
 * The gate that stands between a generated site and somebody's GitHub account.
 *
 *   node harness/verify.mjs --template templates/minimal --profile ./profile.json
 *   node harness/verify.mjs --template templates/minimal --fixture schema/fixtures/sparse.json
 *
 * Gates run cheapest-first and stop at the first failure, so a 40-character
 * overflow costs milliseconds instead of a full build and browser launch.
 * Exit code 0 means, and only ever means, safe to publish.
 */

import { readFile, writeFile, copyFile, access, cp, rm, stat } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateProfile } from './validate-profile.mjs';
import { checkBuild } from './checks/build.mjs';
import { checkLayout } from './checks/layout.mjs';
import { checkA11y } from './checks/a11y.mjs';
import { checkRuntime } from './checks/runtime.mjs';
import { checkLinks } from './checks/links.mjs';
import { serveStatic } from './lib/serve.mjs';
import { printReport, dim } from './lib/report.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));
const exists = (p) => access(p).then(() => true, () => false);

function parseArgs(argv) {
  const out = { routes: ['/'] };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    const value = argv[i + 1];
    if (!key) continue;
    if (key === 'routes') out.routes = value.split(',').map((r) => r.trim());
    else out[key] = value;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const templateDir = resolve(args.template || '');
  const profilePath = resolve(args.profile || args.fixture || '');

  if (!args.template || !profilePath) {
    console.error('usage: verify.mjs --template <dir> (--profile <file> | --fixture <file>) [--assets <dir>] [--routes /,/about]');
    process.exit(2);
  }
  if (!(await exists(join(templateDir, 'template.json')))) {
    console.error(`No template.json in ${templateDir}. See templates/README.md for the contract.`);
    process.exit(2);
  }

  const manifest = await readJson(join(templateDir, 'template.json'));
  const profile = await readJson(profilePath);

  console.log(dim(`template  ${manifest.name} v${manifest.version}`));
  console.log(dim(`profile   ${profilePath}`));

  const results = [];
  const stop = () => {
    printReport(results);
    process.exit(1);
  };

  // Gate 0 — schema. Milliseconds, and catches most content-shaped breakage.
  const schemaResult = await validateProfile(profile, templateDir);
  results.push(schemaResult);
  if (!schemaResult.ok) stop();

  // Inject the profile the template will build against.
  const injectedAt = join(templateDir, 'src', 'profile.json');
  const backup = `${injectedAt}.harness-backup`;
  const hadOriginal = await exists(injectedAt);
  if (hadOriginal) await copyFile(injectedAt, backup);
  await writeFile(injectedAt, JSON.stringify(profile, null, 2));

  // Assets get injected from two places, in priority order.
  //
  // The user's own images come first: verification has to run against what
  // will actually be published, or a real avatar fails the broken-image check
  // here while staging would have handled it perfectly well.
  //
  // The shared fixture placeholders fill whatever is left. Supplying them
  // centrally means every template renders the image paths for free —
  // otherwise each contributor hand-makes placeholders just to pass CI, and
  // the broken-image check quietly becomes the thing everyone works around.
  const assetTarget = join(templateDir, 'public');
  const injectedAssets = [];
  const { readdir } = await import('node:fs/promises');

  const injectFrom = async (dir) => {
    if (!dir || !(await exists(dir))) return;
    for (const entry of await readdir(dir)) {
      const dest = join(assetTarget, entry);
      // Never clobber a template's own assets, nor an earlier, higher-priority
      // source. A directory that already exists is merged rather than skipped,
      // so user images and placeholders can share images/.
      if (await exists(dest)) {
        const info = await stat(join(dir, entry));
        if (!info.isDirectory()) continue;
        await cp(join(dir, entry), dest, { recursive: true, force: false, errorOnExist: false });
        continue;
      }
      await cp(join(dir, entry), dest, { recursive: true });
      injectedAssets.push(dest);
    }
  };

  await injectFrom(args.assets ? resolve(args.assets) : null);
  await injectFrom(join(HERE, '..', 'schema', 'fixtures', 'assets'));

  let browser;
  try {
    // Gate 1 — build and budgets.
    const buildResult = await checkBuild(templateDir, manifest);
    results.push(buildResult);
    if (!buildResult.ok) stop();

    const outDir = join(templateDir, manifest.outDir || 'dist');
    const server = await serveStatic(outDir);

    try {
      const { chromium } = await import('playwright');
      // Some CI images and sandboxes ship a Chromium that does not match the
      // build this Playwright version would download, and cannot reach the
      // download host anyway. Point the harness at it rather than pinning the
      // harness to whatever a given image happens to carry.
      browser = await chromium.launch(
        process.env.FORGE_CHROMIUM_PATH ? { executablePath: process.env.FORGE_CHROMIUM_PATH } : {}
      );

      // Gates 2-5 — everything that needs a real browser, cheapest first.
      results.push(await checkRuntime(browser, server.url, args.routes));
      results.push(await checkLayout(browser, server.url, args.routes));
      results.push(await checkLinks(browser, server.url, args.routes));
      results.push(await checkA11y(browser, server.url, args.routes));
    } finally {
      await browser?.close();
      await server.close();
    }
  } finally {
    // Never leave a contributor's checkout holding someone else's profile or
    // a stray fixture asset.
    if (hadOriginal) await copyFile(backup, injectedAt);
    for (const dest of injectedAssets) await rm(dest, { recursive: true, force: true });
  }

  process.exit(printReport(results) ? 0 : 1);
}

main().catch((err) => {
  console.error('\nHarness crashed — this is a harness bug, not a site failure.\n');
  console.error(err);
  process.exit(3);
});
