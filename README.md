# Portfolio Forge

**Ask once. Get a live, verified portfolio site on your own GitHub.**

```
/portfolio-forge
```

Portfolio Forge interviews you, writes your content, builds a production site
from a pre-tested template, proves it works at every screen size, and deploys it
to your own GitHub Pages. It hands back a URL that is already live.

> **Status:** early. The skill, schema, verification harness and CI are in place.
> Templates are being added — see [Roadmap](#roadmap).

## Why it does not produce broken sites

Most "AI builds your website" tools ask a model to write an app from scratch.
That is a coin flip, and you are the one holding it.

This one never generates a layout. It **selects a template that already works**
and injects your content into it. Every template in `templates/` is a real,
buildable site that is verified in this repo's CI every night — against a sparse
profile and a full one, at six breakpoints.

Then your specific site is verified again before anything is published:

| Gate | What it proves |
|---|---|
| `schema` | Your content fits the slots it was written for |
| `build` | It compiles, and stays inside its bundle budget |
| `runtime` | No console errors, no failed requests, no broken images |
| `layout` | No overflow or clipped text at 350–1536px |
| `links` | No dead or unlabelled links |
| `a11y` | Zero WCAG 2.2 AA violations |

**Nothing is pushed to your GitHub until every gate is green.**

### The insight the gates are built on

Generated portfolios almost never break because the CSS is wrong. They break
because **real content is a different size than the content the template was
designed with** — a 14-word tagline in a slot drawn for four words, a 60-character
job title in a 30-character line. Text clips, cards jump, a grid collapses on
mobile. No compiler catches any of it.

So Portfolio Forge defends on both sides: every field has a measured character
bound that content is validated against before a build is ever attempted, and
the built site is then measured in a real browser at every breakpoint.

## Install

```
/plugin marketplace add sheikharfaz/portfolio-forge
/plugin install portfolio-forge
```

Then just ask — "build me a portfolio" — or run `/portfolio-forge`.

### Requirements

- A GitHub account, with [`gh`](https://cli.github.com) installed and
  authenticated (`gh auth login`)
- Node.js 20.11 or newer
- That is all. No hosting account, no API keys, no payment.

## What a run looks like

1. **Preflight** — checks your tools before asking you anything.
2. **Profile** — starts from what's already known about you, fills gaps from
   your GitHub and resume, then asks about six questions. You approve the result.
3. **Template** — two or three candidates, with a recommendation.
4. **Content** — your copy, written to fit.
5. **Verify** — every gate above. Failures are fixed and re-run automatically.
6. **Deploy** — creates the repo (with your explicit go-ahead), pushes, enables
   Pages, waits for the deploy, and confirms the URL returns 200.

Four to eight minutes for a static template; ten to fifteen with WebGL.

You are asked exactly twice: to approve your profile, and to approve creating a
public repository under your name. Everything else is hands-off.

## Afterwards

Your site is a normal repo you own. To change anything, edit `profile.json` and
push — Pages rebuilds. Most updates never need this tool again.

## Repository layout

```
.claude-plugin/     plugin + marketplace manifests
skills/             the skill: a short router plus ten detailed playbooks
agents/             content-writer, verifier, deployer
schema/             profile.schema.json — the character bounds live here
  fixtures/         sparse.json and full.json, used by every CI run
harness/            the verification gates
  checks/           build, layout, a11y, runtime, links
templates/          the tested sites (see templates/README.md for the contract)
```

## Verifying a site yourself

```bash
cd harness && npm ci && npx playwright install chromium && cd ..
node harness/verify.mjs --template templates/minimal --profile ./profile.json
```

Exit 0 means safe to publish. Nothing else does.

## Roadmap

- [x] Plugin skeleton, skill, and playbooks
- [x] Profile schema with per-template constraint narrowing
- [x] Verification harness — schema, build, runtime, layout, links, a11y
- [x] CI: unit tests, per-template matrix, nightly rot detection
- [ ] `minimal` template — typography-led, no WebGL
- [ ] `aurora` template — scroll-driven WebGL
- [ ] `terminal` template — monospace, high contrast
- [ ] Deploy script and end-to-end run
- [ ] Templates 4–10, community contributed

## Contributing

New templates are the most useful contribution, and you do not need anyone's
approval of your taste — **the harness is the gatekeeper.** If your template
passes both fixtures, it qualifies. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) and
[`templates/README.md`](templates/README.md).

## License

MIT. Sites it generates belong entirely to the people who generate them, with no
attribution requirement.
