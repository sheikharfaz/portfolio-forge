# Contributing

The most valuable thing you can add here is a **template**.

You do not need to convince anyone that your design is good. The verification
harness is the gatekeeper: if a template passes both fixtures, it qualifies.
That is the whole point — it lets this scale past the taste of one maintainer.

## Adding a template

1. Read [`templates/README.md`](templates/README.md). It is the contract, and it
   is enforced mechanically.
2. Build your site under `templates/<name>/`, reading its content from
   `src/profile.json`.
3. Declare your slot bounds in `template.json` under `constraints`. **Be honest
   and be tight.** If your hero fits 48 characters, say 48. A generous bound is
   not generosity — it means somebody's headline clips on their live site.
4. Make it pass both fixtures:

```bash
cd harness && npm ci && npx playwright install chromium && cd ..
node harness/verify.mjs --template templates/<name> --fixture schema/fixtures/sparse.json
node harness/verify.mjs --template templates/<name> --fixture schema/fixtures/full.json
```

Both must exit 0. CI runs exactly these two commands.

5. Add `preview.webp` — a 1280x800 screenshot of the full-fixture build.

### The sparse fixture is not optional

Plenty of people have two projects and no job history. A template that only
looks good when full is not finished. `sparse.json` exists to make that
impossible to skip.

## Rules that will not be relaxed

- **Exact dependency versions.** No `^`, no `~`, lockfile committed. A silent
  minor bump is the most common way a template repo rots.
- **No network at runtime.** Self-host fonts, commit assets. Generated sites
  must work behind a strict CSP and must not leak visitors to third parties.
- **Zero a11y violations.** Not few. Zero.
- **Respect `prefers-reduced-motion`.** Animation is the point of this project;
  shipping motion someone cannot turn off is not.
- **No horizontal scroll from 350px to 1536px.**

## Changing the base schema

Widening a bound in `schema/profile.schema.json` affects every template, so it
needs a reason beyond one template wanting more room — a template can already
narrow, but never widen.

If your template needs a field that does not exist, propose it in an issue
first. The schema is closed (`additionalProperties: false`) on purpose, so typos
surface as errors instead of silently vanishing from someone's site.

## Changing the harness

Gates may be added. Gates are not removed or softened to make something pass —
every gate exists because something shipped broken once.

If a gate produces a false positive, that is a real bug worth fixing properly.
Please open an issue with a reproduction rather than adding an exception.

Run `cd harness && npm test` before submitting.

## Reporting a broken generated site

Include the template name and version, your `profile.json` with anything private
removed, and the harness output. A site that broke despite passing the gates
means a gate has a hole, which is the most important kind of bug here.
