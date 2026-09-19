/**
 * Gate — layout integrity across breakpoints.
 *
 * This is the gate that catches what "it compiled fine" never will. Generated
 * portfolios rarely break because the CSS is wrong; they break because real
 * content is a different size than the content the template was designed with.
 * A 14-word tagline in a slot drawn for four words clips, pushes, or reflows
 * into garbage — and nothing else in the pipeline notices.
 *
 * Every assertion here is mechanical. No screenshots to eyeball, no judgement.
 */

import { finding, pass, fail, SEVERITY } from '../lib/report.mjs';

/** Mirrors the breakpoint scale templates are built against. */
export const BREAKPOINTS = [
  { name: 'xs', width: 350, height: 720 },
  { name: 'sm', width: 576, height: 900 },
  { name: 'md', width: 768, height: 1024 },
  { name: 'lg', width: 1024, height: 768 },
  { name: 'xl', width: 1280, height: 800 },
  { name: 'xxl', width: 1536, height: 960 },
];

/** Runs inside the page. Returns plain data only — nothing here crosses back as a handle. */
/* c8 ignore start */
function collectLayoutProblems(viewportWidth) {
  const problems = [];
  const describe = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls = typeof el.className === 'string' && el.className
      ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
      : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };

  const doc = document.documentElement;

  // 1. Horizontal overflow of the page itself.
  if (doc.scrollWidth > doc.clientWidth + 1) {
    problems.push({
      kind: 'page-overflow',
      where: 'document',
      detail: `page scrolls horizontally: content is ${doc.scrollWidth}px wide in a ${doc.clientWidth}px viewport`,
    });
  }

  const all = Array.from(document.body.querySelectorAll('*'));

  for (const el of all) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;

    // Screen-reader-only text is a 1px box that deliberately clips its content.
    // That is the technique working correctly, not a layout failure, and it is
    // invisible to sighted users either way.
    if (rect.width <= 1 || rect.height <= 1) continue;

    // 2. An element extending past the viewport. Fixed/sticky decoration that is
    //    deliberately off-canvas is excluded via a data attribute opt-out.
    if (el.dataset.forgeAllowOverflow === undefined) {
      if (rect.right > viewportWidth + 1 || rect.left < -1) {
        problems.push({
          kind: 'element-overflow',
          where: describe(el),
          detail: `spans ${Math.round(rect.left)}px..${Math.round(rect.right)}px, outside the 0..${viewportWidth}px viewport`,
        });
      }
    }

    // 3. Text clipped by its own box. `overflow: hidden` with no line clamp means
    //    content is silently disappearing — the user never sees what was cut.
    const clipsX = style.overflowX === 'hidden' || style.overflowX === 'clip';
    const clipsY = style.overflowY === 'hidden' || style.overflowY === 'clip';
    const hasClamp = style.webkitLineClamp && style.webkitLineClamp !== 'none';
    const hasEllipsis = style.textOverflow === 'ellipsis';

    if (clipsY && !hasClamp && el.scrollHeight > el.clientHeight + 2) {
      problems.push({
        kind: 'text-clipped',
        where: describe(el),
        detail: `content is ${el.scrollHeight}px tall in a ${el.clientHeight}px box with overflow hidden and no line-clamp`,
      });
    }
    if (clipsX && !hasEllipsis && el.scrollWidth > el.clientWidth + 2) {
      problems.push({
        kind: 'text-clipped',
        where: describe(el),
        detail: `content is ${el.scrollWidth}px wide in a ${el.clientWidth}px box with overflow hidden and no ellipsis`,
      });
    }

    // 4. Tap targets below the 24px floor WCAG 2.2 sets for pointer input.
    //    SC 2.5.8 exempts targets inline in a block of text, so a link in a
    //    sentence is not a finding — flagging them trains people to ignore
    //    this check, which is how the real ones get missed.
    const interactive = el.matches('a[href], button, input, select, textarea, [role="button"], [role="link"]');
    const inlineInText = style.display === 'inline';
    if (interactive && !inlineInText && rect.width > 0 && (rect.width < 24 || rect.height < 24)) {
      problems.push({
        kind: 'tap-target',
        where: describe(el),
        detail: `${Math.round(rect.width)}x${Math.round(rect.height)}px, below the 24x24 minimum`,
      });
    }

    // 5. Images that never loaded. A broken portrait on someone's portfolio is
    //    worse than no portrait.
    if (el.tagName === 'IMG' && el.complete && el.naturalWidth === 0) {
      problems.push({
        kind: 'broken-image',
        where: `${describe(el)} [src="${el.getAttribute('src')}"]`,
        detail: 'image failed to load',
      });
    }
  }

  return problems;
}
/* c8 ignore stop */

const FIX = {
  'page-overflow': 'Usually one wide child. Find the element flagged alongside this and constrain it (max-width: 100%, min-width: 0 on flex/grid children).',
  'element-overflow': 'Add min-width: 0 if it is a flex/grid child, or wrap long unbroken strings with overflow-wrap: anywhere.',
  'text-clipped': 'Shorten the content in profile.json, or tighten the template constraint for this field so content can never reach this length.',
  'tap-target': 'Increase padding or set a min-height/min-width of 24px on the control.',
  'broken-image': 'Check the asset path in profile.json is relative to the template public/ directory and that the file is committed.',
};

/**
 * @param {import('playwright').Browser} browser
 * @param {string} baseUrl
 * @param {string[]} routes
 */
export async function checkLayout(browser, baseUrl, routes = ['/']) {
  const findings = [];

  for (const bp of BREAKPOINTS) {
    const context = await browser.newContext({
      viewport: { width: bp.width, height: bp.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce', // settle animations so measurements are stable
    });
    const page = await context.newPage();

    try {
      for (const route of routes) {
        const url = new URL(route, baseUrl).toString();
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
        // Let any entrance transition that ignores reduced-motion finish.
        await page.waitForTimeout(400);

        const problems = await page.evaluate(collectLayoutProblems, bp.width);

        for (const p of problems) {
          findings.push(
            finding({
              gate: 'layout',
              severity: p.kind === 'tap-target' ? SEVERITY.WARN : SEVERITY.ERROR,
              where: `${bp.name} (${bp.width}px) ${route} — ${p.where}`,
              message: p.detail,
              fix: FIX[p.kind],
            })
          );
        }
      }
    } finally {
      await context.close();
    }
  }

  return findings.length ? fail('layout', findings) : pass('layout');
}
