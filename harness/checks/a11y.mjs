/**
 * Gate — accessibility. Zero violations, not "few".
 *
 * A generated site is published under someone's own name on their own domain.
 * Shipping them an inaccessible one, silently, is not a defensible default.
 */

import { AxeBuilder } from '@axe-core/playwright';
import { finding, pass, fail } from '../lib/report.mjs';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

export async function checkA11y(browser, baseUrl, routes = ['/']) {
  const findings = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    for (const route of routes) {
      await page.goto(new URL(route, baseUrl).toString(), { waitUntil: 'networkidle', timeout: 30_000 });

      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();

      for (const v of violations) {
        for (const node of v.nodes) {
          findings.push(
            finding({
              gate: 'a11y',
              where: `${route} — ${node.target.join(' ')}`,
              message: `${v.id}: ${v.help}`,
              fix: `${node.failureSummary?.split('\n').filter(Boolean).slice(1).join(' ') || v.description} — ${v.helpUrl}`,
            })
          );
        }
      }
    }
  } finally {
    await context.close();
  }

  return findings.length ? fail('a11y', findings) : pass('a11y');
}
