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

const HERE = dirname(fileURLToPath(import.meta.url));
const templateDir = resolve(process.argv[2] || '');

if (!process.argv[2]) {
  console.error('usage: screenshot-template.mjs templates/<name>');
  process.exit(2);
}

const server = await serveStatic(join(templateDir, 'dist'));
const browser = await chromium.launch(
  process.env.FORGE_CHROMIUM_PATH ? { executablePath: process.env.FORGE_CHROMIUM_PATH } : {}
);

try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  await page.goto(server.url, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(800);

  const out = join(templateDir, 'preview.png');
  await page.screenshot({ path: out });
  console.log(`wrote ${out}`);
} finally {
  await browser.close();
  await server.close();
}
