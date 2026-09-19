# Portfolio Forge

**Ask once. Get a live, verified portfolio site on your own GitHub.**

```
/portfolio-forge
```

Portfolio Forge interviews you, writes your content, builds a production site
from a pre-tested template, proves it works at every screen size, and deploys it
to your own GitHub Pages. It hands back a URL that is already live.

> **Status:** ten templates, all green. The schema, harness, CI, deploy script
> and memory importer are in place. The one thing not yet proven is a full run
> end to end on a real machine — see [Roadmap](#roadmap).

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

## The templates

Ten of them, each a real buildable site verified in CI every night against
a sparse profile and a full one. You are shown two or three that fit, not a
catalogue — people choose worse from ten options than from three.

| | | | Motion |
|---|---|---|---|
| [`minimal`](templates/minimal) | Minimal | Typography-led, no WebGL. Builds in seconds and works on any device. The hardest template to make look bad. | — |
| [`aurora`](templates/aurora) | Aurora | Dark, scroll-driven and alive. A live WebGL aurora behind the content, with a static bloom on anything smaller than a laptop. | WebGL |
| [`terminal`](templates/terminal) | Terminal | Monospace, high contrast, structured like a shell session. No images required, builds in seconds, and reads well to anyone who lives in a terminal. | — |
| [`editorial`](templates/editorial) | Editorial | Serif, light, and generous. Reads like a magazine feature rather than a CV — best when the writing is the strongest thing you have. | — |
| [`brutalist`](templates/brutalist) | Brutalist | Thick borders, hard edges, no gradients. Loud and unmistakable — for people who would rather be remembered than blend in. | — |
| [`canvas`](templates/canvas) | Canvas | Image-forward gallery. Project screenshots lead and text follows — built for designers and anyone whose work is worth looking at. | — |
| [`compact`](templates/compact) | Compact | Dense, two-column, and print-friendly. Everything a recruiter needs without scrolling, and it prints to a clean page. | — |
| [`gradient`](templates/gradient) | Gradient | A slow-drifting colour field behind soft glass panels. All CSS, no WebGL — the movement costs nothing and stops entirely under reduced motion. | CSS |
| [`sidebar`](templates/sidebar) | Sidebar | Identity pinned to a fixed left column while the content scrolls beside it. Orientation never leaves the screen. | — |
| [`timeline`](templates/timeline) | Timeline | Chronology first. Roles, study and dated projects merge into one spine, so a long career reads as a single arc. | — |

Each directory holds a `preview.jpg`, generated from that template's own
build rather than cropped by hand, and scrolled to whatever part of the page
actually shows what makes it different.

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
scripts/            deploy, staging, preflight, template screenshots
templates/          the tested sites (see templates/README.md for the contract)
```

## Verifying a site yourself

```bash
cd harness && npm ci && npx playwright install chromium && cd ..
node harness/verify.mjs --template templates/minimal --profile ./profile.json
```

Exit 0 means safe to publish. Nothing else does.

## Importing what another assistant knows about you

There is **no API** for Claude, ChatGPT or Gemini memory — no tool can read it,
and anything claiming to is fabricating. What does work is the export each
vendor lets you download of your own data:

| Assistant | Where |
|---|---|
| Claude | Settings → Privacy → Export data |
| ChatGPT | Settings → Data controls → Export data |
| Gemini | takeout.google.com → Gemini Apps |

```bash
node scripts/import-memory.mjs --input ~/Downloads/claude-export
```

It reads **only your own messages** and reports the technologies you mention
repeatedly, repositories you linked to, how you have described yourself, and a
few writing samples for matching your tone.

Everything it returns is a **candidate you confirm**, never a fact. A frequency
count is not a skill — someone who asked about Kubernetes forty times may have
been losing a fight with it. Nothing is uploaded; the export never leaves your
machine.

## Running it end to end

[`RUNBOOK.md`](RUNBOOK.md) is the full sequence: install, profile, dry run,
publish, and what to do when a gate fails.

## Deploying by hand

```bash
node scripts/deploy.mjs --profile ./profile.json --assets ./assets --dry-run
```

The deploy script runs the harness itself and refuses to create anything unless
every gate passes, so the ordering that makes the guarantee work is enforced in
code rather than left to whoever is driving. A dry run verifies and stages
without creating anything, so you can read exactly what would be published.

Drop `--dry-run` to publish. It creates the repo, pushes, enables Pages, waits
for the deploy and polls the URL until it returns 200 — and asks before
creating anything public under your name.

## Roadmap

- [x] Plugin skeleton, skill, and playbooks
- [x] Profile schema with per-template constraint narrowing
- [x] Verification harness — schema, build, runtime, layout, links, a11y
- [x] CI: unit tests, per-template matrix, nightly rot detection
- [x] `minimal` template — typography-led, no WebGL
- [x] `aurora` template — scroll-driven WebGL
- [x] `terminal` template — monospace, high contrast
- [x] Deploy script — verify-gated, dry-runnable
- [ ] End-to-end run: one command from interview to live URL
- [x] Memory-export parser (ChatGPT / Claude / Gemini exports → profile candidates)
- [x] Templates 4–10 — editorial, brutalist, canvas, compact, gradient, sidebar, timeline
- [ ] Community-contributed templates (the harness is the gatekeeper — see CONTRIBUTING.md)

## Contributing

New templates are the most useful contribution, and you do not need anyone's
approval of your taste — **the harness is the gatekeeper.** If your template
passes both fixtures, it qualifies. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) and
[`templates/README.md`](templates/README.md).

## License

MIT. Sites it generates belong entirely to the people who generate them, with no
attribution requirement.
