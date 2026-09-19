# The template contract

A template is a real, buildable site — not a prompt. Content is injected into it;
layout is never generated. This is the whole reason a Forge run cannot produce a
broken site: the layout was already proven correct before the user arrived.

A directory under `templates/` is a valid template when it satisfies everything
below. The verification harness checks this mechanically, so a contributor does
not need anyone's taste to be trusted — only a green run.

## Required layout

```
templates/<name>/
├── template.json        # manifest (see below)
├── package.json         # exact pinned deps, no ^ or ~
├── package-lock.json    # committed
├── preview.png          # 1280x800 screenshot, from scripts/screenshot-template.mjs
├── src/
│   └── profile.json     # placeholder, overwritten at generation time
└── ...                  # whatever the template needs
```

## `template.json`

```json
{
  "name": "minimal",
  "title": "Minimal",
  "description": "Typography-led, no WebGL, builds in under 10 seconds.",
  "version": "1.0.0",
  "author": "you",
  "license": "MIT",
  "buildCommand": "npm run build",
  "outDir": "dist",
  "sections": ["hero", "about", "skills", "projects", "experience", "contact"],
  "capabilities": {
    "webgl": false,
    "darkMode": true,
    "contactProviders": ["formspree", "mailto", "none"],
    "minNodeVersion": "20.11.0"
  },
  "constraints": {
    "identity.headline": { "maxLength": 48 },
    "projects": { "maxItems": 6 },
    "skills": { "maxItems": 4 }
  },
  "budgets": {
    "maxBundleKb": 250,
    "minLighthousePerformance": 90,
    "minLighthouseAccessibility": 100
  }
}
```

### `constraints`

Dotted paths into the profile that this template tightens **below** the base
schema in `schema/profile.schema.json`. A template may only narrow, never widen:
the harness rejects a manifest that tries to raise a bound.

This is where UI breakage actually gets prevented. If your hero slot fits 48
characters, say 48 here — then the content writer is mechanically unable to
overflow it, because validation fails before a build is ever attempted.

### `capabilities`

Declares what the template supports so the router never hands it a profile it
cannot render — a `webgl: false` template is never selected for someone who
asked for 3D, and a template that does not list `emailjs` never receives an
EmailJS contact config.

### `budgets`

Hard ceilings enforced by the harness. Exceeding one fails the template, not the
user's run.

`maxBundleKb` is **gzipped** JS+CSS, because that is what a visitor actually
downloads. Measuring raw bytes makes a React baseline look like bloat when its
wire cost is a third of it, and a budget nobody can meet is a budget everyone
raises.

## Rules that are not negotiable

1. **Exact dependency versions.** No `^`, no `~`, lockfile committed. A template
   that builds today must build unchanged in a year; a silent minor bump is the
   most common way these repos rot.
2. **No network at build or runtime** beyond fonts you self-host and assets you
   commit. Generated sites must work behind a strict CSP.
3. **Every interactive element reachable by keyboard**, visible focus ring, and a
   correct heading order. The a11y gate is set to zero violations, not "few".
4. **Respect `prefers-reduced-motion`.** Animation is the point of this project;
   shipping motion someone cannot turn off is not.
5. **No horizontal scroll at any breakpoint** from 350px to 1536px.
6. **Renders correctly with the sparse fixture.** Plenty of users have two
   projects and no job history. A template that only looks good when full is not
   done.

## Adding a template

```bash
node harness/verify.mjs --template templates/<name> --fixture schema/fixtures/sparse.json
node harness/verify.mjs --template templates/<name> --fixture schema/fixtures/full.json
```

Both must pass before a pull request is considered. CI runs exactly these two
commands against every template nightly, so breakage surfaces here rather than in
somebody's published site.

The fixtures reference an avatar and an OG image. You do not need to supply
them — the harness copies shared placeholders from `schema/fixtures/assets/`
into your `public/` for the run and removes them afterwards, and it never
overwrites a file your template already has there.

If your environment ships a Chromium that Playwright did not install (many CI
images and sandboxes do), point the harness at it with `FORGE_CHROMIUM_PATH`
rather than pinning the harness to that image's browser build.
