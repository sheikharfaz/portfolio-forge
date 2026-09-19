# Phase 4 — Verification

```bash
node harness/verify.mjs --template templates/<name> --profile ./profile.json --assets ./assets
```

Pass `--assets` whenever the profile references local images. Verifying without
them checks a site that is not the one being published, and a real avatar fails
the broken-image check here while staging would have handled it perfectly well.
`deploy.mjs` forwards the flag for you.

**Exit 0 is the only thing that authorises a deploy.** Not a clean build, not a
screenshot that looks right, not your own reading of the code.

## The gates, in the order they run

| Gate | Catches | Cost |
|---|---|---|
| `schema` | Content that cannot fit the layout | ms |
| `build` | Compile errors, bundle budget overruns | 10s–3min |
| `runtime` | Console errors, failed requests, uncaught exceptions | ~5s |
| `layout` | Overflow, clipping, broken images, tiny tap targets, at 6 breakpoints | ~20s |
| `links` | Dead internal links, unlabelled links, empty hrefs | ~10s |
| `a11y` | WCAG 2.2 AA violations, zero tolerance | ~10s |

Cheapest first, stopping at the first failure. A 3-character overflow should
never cost a full build and a browser launch.

## Why `layout` is the one that matters

Generated portfolios almost never break because the CSS is wrong — the CSS was
correct when the template was designed. They break because **real content is a
different size than the content it was designed with.**

The `layout` gate loads the built site at 350, 576, 768, 1024, 1280 and 1536px
and asserts mechanically: no horizontal scroll, nothing outside the viewport, no
text clipped by its own box, no tap target under 24px, no broken image. No
screenshots to eyeball, no judgement calls, no flakes.

## An optional visual pass

For high-stakes runs, after the gates are green, screenshot each breakpoint and
have the `verifier` subagent answer one question: *does this look broken?* Not
"is it beautiful" — the template already settled that. Only: is anything
overlapping, misaligned, or empty that should not be.

This is a supplement to the mechanical gates, never a substitute.

## When a gate fails

Read `troubleshooting.md`. The short version: **the fix is usually the content,
not the template.** Shorten the string, drop the section, swap the asset.

Three rounds maximum on one template. Then fall back to `minimal` and tell the
user why. Never disable a gate, never lower a budget, and never widen a schema
bound to get to green — each of those ships the breakage instead of fixing it.
