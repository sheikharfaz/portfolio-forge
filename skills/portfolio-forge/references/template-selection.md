# Phase 2 — Template selection

## Read the manifests, do not guess

```bash
for t in templates/*/; do node -e "
  const m = require('./$t/template.json');
  console.log(m.name.padEnd(12), m.capabilities.webgl ? 'webgl' : 'static', '—', m.description);
"; done
```

`template.json` is authoritative for what a template supports. Never assume a
template handles a contact provider, a section, or dark mode because a similar
one does.

## Matching

| The user is | Lean toward |
|---|---|
| A designer, or wants to be remembered | The most expressive template they can afford |
| A senior engineer, values substance | `minimal` — restraint reads as confidence |
| Targeting recruiters who skim | Anything where projects are above the fold |
| On a slow connection or older phone | `minimal`. Not negotiable — WebGL is a poor trade there |
| Unsure | `minimal`. It is the hardest to make look bad |

Hard constraints first, taste second. A profile with eight projects cannot use a
template whose `constraints` cap it at four, no matter how good it looks.

## Do not over-ask

Show two or three candidates with one line each and a preview image. Recommend
one, with a reason:

> I'd go with **Aurora** — you've got strong visual projects and the scroll
> animation gives them room. **Minimal** is the safer pick if you want it to
> load instantly on any device. Aurora?

Do not paste a catalogue. People pick worse when shown ten options than three.

## On WebGL

The 3D templates are the reason this project exists, and they are also the most
common way a portfolio becomes unusable.

- Never on mobile. Every WebGL template ships a static fallback below `md`.
- Always honours `prefers-reduced-motion`.
- The bundle is heavier; the budget in `template.json` accounts for it.

If someone wants 3D and their audience is recruiters on laptops, that is a good
trade. If their audience is on phones in a weak-signal area, say so and
recommend otherwise. Make the tradeoff visible, then respect their choice.

## Record it

Set `site.template` in the profile. The harness validates against that
template's constraints from here on, so getting it wrong means re-validating
everything.
