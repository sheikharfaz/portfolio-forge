/**
 * Gate — runtime cleanliness.
 *
 * Console errors, unhandled rejections and failed requests are the difference
 * between a site that looks fine in a screenshot and one that actually works.
 */

import { finding, pass, fail, SEVERITY } from '../lib/report.mjs';

// Noise that is not the generated site's fault and not actionable by the user.
const IGNORE = [
  /favicon\.ico/i,
  /ResizeObserver loop/i,
  /Download the React DevTools/i,
  // Headless Chromium's software GL emits performance advisories while
  // Playwright reads pixels back for screenshots. It is the test environment
  // talking about itself, not the site, and it does not occur in a real browser.
  /GL Driver Message/i,
  /GPU stall due to ReadPixels/i,
];

const ignorable = (text) => IGNORE.some((re) => re.test(text));

export async function checkRuntime(browser, baseUrl, routes = ['/']) {
  const findings = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const record = (severity, where, message, fix) => {
    if (ignorable(message)) return;
    findings.push(finding({ gate: 'runtime', severity, where, message, fix }));
  };

  try {
    for (const route of routes) {
      page.removeAllListeners();

      page.on('console', (msg) => {
        if (msg.type() === 'error') record(SEVERITY.ERROR, `${route} — console`, msg.text());
        if (msg.type() === 'warning') record(SEVERITY.WARN, `${route} — console`, msg.text());
      });
      page.on('pageerror', (err) => {
        record(SEVERITY.ERROR, `${route} — uncaught`, err.message, 'An exception reached the top level; the page is very likely partially dead.');
      });
      page.on('requestfailed', (req) => {
        record(SEVERITY.ERROR, `${route} — request`, `${req.method()} ${req.url()} failed: ${req.failure()?.errorText}`,
          'Commit the asset, or drop the reference. Generated sites must not depend on third-party origins at runtime.');
      });
      page.on('response', (res) => {
        if (res.status() >= 400) {
          record(SEVERITY.ERROR, `${route} — request`, `${res.status()} ${res.url()}`, 'Fix or remove the reference.');
        }
      });

      await page.goto(new URL(route, baseUrl).toString(), { waitUntil: 'networkidle', timeout: 30_000 });
      await page.waitForTimeout(1000);
    }
  } finally {
    await context.close();
  }

  return findings.length ? fail('runtime', findings) : pass('runtime');
}
