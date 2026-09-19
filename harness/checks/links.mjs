/**
 * Gate — links.
 *
 * Internal links are followed; external ones are only shape-checked, because a
 * verification run must not depend on somebody else's uptime. A flaky gate is
 * worse than no gate: it teaches people to re-run until it passes.
 */

import { finding, pass, fail, SEVERITY } from '../lib/report.mjs';

export async function checkLinks(browser, baseUrl, routes = ['/']) {
  const findings = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const seenInternal = new Set();

  try {
    for (const route of routes) {
      await page.goto(new URL(route, baseUrl).toString(), { waitUntil: 'networkidle', timeout: 30_000 });

      const anchors = await page.$$eval('a', (els) =>
        els.map((a) => ({
          href: a.getAttribute('href'),
          resolved: a.href,
          text: (a.textContent || '').trim().slice(0, 40),
          target: a.getAttribute('target'),
          rel: a.getAttribute('rel'),
          labelled: Boolean((a.textContent || '').trim() || a.getAttribute('aria-label') || a.querySelector('img[alt]:not([alt=""])')),
        }))
      );

      for (const a of anchors) {
        const where = `${route} — <a>${a.text ? ` "${a.text}"` : ''}`;

        if (!a.href || a.href === '#' || a.href.trim() === '') {
          findings.push(finding({ gate: 'links', where, message: 'Empty or placeholder href.',
            fix: 'Point it somewhere real, or render a <button> if it is not navigation.' }));
          continue;
        }
        if (!a.labelled) {
          findings.push(finding({ gate: 'links', where, message: 'Link has no accessible name.',
            fix: 'Add visible text, an aria-label, or alt text on the icon inside it.' }));
        }
        if (a.target === '_blank' && !(a.rel || '').includes('noopener')) {
          findings.push(finding({ gate: 'links', severity: SEVERITY.WARN, where,
            message: 'target="_blank" without rel="noopener".', fix: 'Add rel="noopener noreferrer".' }));
        }

        const url = new URL(a.resolved);
        const isInternal = url.origin === new URL(baseUrl).origin;

        if (isInternal) {
          const key = url.pathname + url.search;
          if (seenInternal.has(key)) continue;
          seenInternal.add(key);

          const res = await page.request.get(url.toString()).catch(() => null);
          if (!res || res.status() >= 400) {
            findings.push(finding({ gate: 'links', where, message: `Internal link returns ${res ? res.status() : 'no response'}: ${key}`,
              fix: 'Check the route exists and that the SPA fallback is configured for deep links.' }));
          }
        } else if (url.protocol !== 'https:' && url.protocol !== 'mailto:' && url.protocol !== 'tel:') {
          findings.push(finding({ gate: 'links', where, message: `Non-https external link: ${a.resolved}`,
            fix: 'Use https. A mixed-content link is blocked on a Pages site anyway.' }));
        }
      }
    }
  } finally {
    await context.close();
  }

  return findings.length ? fail('links', findings) : pass('links');
}
