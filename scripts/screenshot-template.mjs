#!/usr/bin/env node
/**
 * Produces the preview image a template ships with, from its current build.
 *
 *   node scripts/screenshot-template.mjs templates/minimal
 *
 * Contributors should not be hand-cropping screenshots; a preview that drifts
 * from what the template actually renders is worse than none, because it is
 * what people choose from.
 */

import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '../harness/node_modules/playwright/index.mjs';
import { serveStatic } from '../harness/lib/serve.mjs';
import { readFile as readManifestFile } from 'node:fs/promises';

const HERE = dirname(fileURLToPath(import.meta.url));
const templateDir = resolve(process.argv[2] || '');

if (!process.argv[2]) {
  console.error('usage: screenshot-template.mjs templates/<name>');
  process.exit(2);
}

const manifest = JSON.parse(await readManifestFile(join(templateDir, 'template.json'), 'utf8'));
const server = await serveStatic(join(templateDir, 'dist'));
const browser = await chromium.launch(
  process.env.FORGE_CHROMIUM_PATH ? { executablePath: process.env.FORGE_CHROMIUM_PATH } : {}
);

try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    // 2x reads better on a retina display, but a shader backdrop's dither
    // noise defeats PNG compression entirely — aurora came out at 3.1MB.
    // JPEG at 1.5x is a tenth of that and indistinguishable on a gallery card.
    deviceScaleFactor: 1.5,
  });
  await page.goto(server.url, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(800);

  // A preview exists so someone can choose between templates, so it has to
  // show the thing that makes this one different. For most that is the hero;
  // for a gallery or a timeline the distinctive part is further down, and a
  // hero-only shot makes every dark template look identical.
  const scrollY = manifest.preview?.scrollY ?? 0;
  if (scrollY > 0) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(700);
  }

  const out = join(templateDir, 'preview.jpg');
  await page.screenshot({ path: out, type: 'jpeg', quality: 82 });
  console.log(`wrote ${out}`);
} finally {
  await browser.close();
  await server.close();
}
