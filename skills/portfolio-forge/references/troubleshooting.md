# Troubleshooting

One principle: **fix the content, not the gate.** Every gate exists because
something shipped broken once. Disabling one is choosing to ship that breakage.

Never, to get to green: widen a schema bound, raise a template budget, drop a
breakpoint, skip the a11y gate, or add `overflow: hidden` to hide an overflow
rather than fix it.

## `schema`

| Finding | Fix |
|---|---|
| `N characters; this slot holds M` | Rewrite shorter. Aim for 80% of the bound. |
| `N items; this template renders at most M` | Keep the strongest M. Or switch template — say which one has room. |
| `Unknown field` | A typo, or a field the schema does not have. Remove it. |
| `does not support the "X" contact provider` | Change provider, or change template. See `contact-forms.md`. |

## `build`

**`npm ci` failed** — lockfile out of sync with `package.json`, or a pinned
version was unpublished. A template bug, not a user bug. Report it as such and
fall back to another template.

**Build failed naming a profile field** — the template and the profile shape
disagree. Fix the template, never the schema.

**Bundle over budget** — usually a WebGL template that is not code-splitting.
Check the 3D stack is behind a dynamic import. Do not raise the budget.

## `runtime`

**Failed request to a third-party origin** — generated sites must be
self-contained. Commit the asset. Fonts get self-hosted; CDN links break under a
strict CSP and leak visitors to a third party.

**Uncaught exception** — read the message. If it names profile data, a field is
a shape the template did not anticipate (an empty array, a missing optional).
Fix the template to handle it: sparse profiles are normal, not an edge case.

## `layout` — the common one

| Finding | What it means | Fix |
|---|---|---|
| `page scrolls horizontally` | Something is wider than the viewport | Look for an `element-overflow` finding at the same breakpoint; that is the culprit |
| `spans -20px..400px, outside the viewport` | One element escaping | `min-width: 0` on a flex/grid child, or `overflow-wrap: anywhere` for long unbroken strings |
| `content is 96px tall in a 48px box` | Text clipped, invisibly | **Shorten the content.** Then tighten that field's constraint in `template.json` so it cannot recur |
| `broken image` | Asset missing or wrong path | Paths are relative to the template's `public/`. Check it is committed |
| `24x18px, below the 24x24 minimum` | Tap target too small | Padding or `min-height` on the control |

Failures only at `xs` (350px) are nearly always a long unbroken string — an
email address, a URL, a package name. Handle it in the template with
`overflow-wrap`, since you cannot shorten someone's email.

## `links`

**Empty or placeholder href** — a section rendered with no data behind it.
Either supply the link or hide the element when the data is absent. A dead link
on a portfolio looks careless.

**Link has no accessible name** — icon-only social links with no `aria-label`.
Template fix.

## `a11y`

**`color-contrast`** — the chosen accent against its background. Adjust
`site.accent` to a darker or lighter shade of the same hue. The gate names the
ratio it needs.

**`heading-order`** — sections rendered out of order, or a skipped level.
Template fix.

**`landmark-one-main`, `region`** — content outside a landmark. Template fix.

Contrast is the only common a11y failure that is content-caused. Everything else
means the template has a bug that needs fixing in the template.

## After three rounds

Stop. Move to `minimal`, which has the widest tolerances, and tell the user
plainly:

> The Aurora template couldn't fit your project descriptions without clipping on
> small screens. I've moved you to Minimal, which handles longer copy. Your
> content is unchanged.

Then open an issue against the template so it is fixed for the next person. A
run that falls back is a successful run. A run that ships a broken site is not.
