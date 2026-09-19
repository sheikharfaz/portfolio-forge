# Design direction

The template already decided the layout, the type scale and the motion. What
remains is narrow on purpose: **accent colour, mode, and section order.**

Resist the urge to redesign inside a run. The template is the tested artefact;
improvising on top of it is how you ship the breakage the harness exists to
prevent.

## Accent colour

One hex value in `site.accent`. The template derives its whole ramp from it.

Pick from what you know: an existing brand, a logo, a colour they mention
liking. With no signal, ask — it is one question and people have opinions.

Two rules:

- **It must pass contrast against the template's background.** The a11y gate is
  zero-tolerance and contrast is the most common way to fail it. Mid-tone
  saturated colours (`#ff4444`, `#00cc88`) fail against dark backgrounds far more
  often than people expect. When in doubt, go darker on a light background and
  lighter on a dark one.
- **One accent.** Templates are built for a single accent plus neutrals. A
  second brand colour is not a small change.

## Mode

`dark`, `light`, or `system`. Default `system` — it respects the visitor rather
than the owner, and every template supports all three.

Pick a fixed mode only if the user asks. Someone who says "I want it dark" means
dark for everyone, not dark for people whose OS already is.

## Section order

`site.sections` controls order. Lead with what the audience came for:

- Recruiters skim → `hero, projects, experience, skills, contact`
- Clients → `hero, services, projects, testimonials, contact`
- Peers → `hero, about, projects, writing, contact`

The template silently ignores any section it does not implement, so check
`template.json`'s `sections` list rather than assuming.

**Drop empty sections.** A "Testimonials" heading over nothing is worse than no
testimonials.

## When Figma is connected

If the Figma MCP tools are available and the user has an existing design, brand
kit or design system:

- `get_variable_defs` → pull real tokens instead of guessing an accent.
- `get_design_context` on a frame they point at → match their existing visual
  language.
- `get_screenshot` → confirm you are reading the frame they meant.

Use it to **inform `site.accent` and asset choices**. Do not use it to
reconstruct a bespoke layout — that is generating a site from scratch under
another name, and it forfeits every guarantee this tool makes.

If Figma is not connected, do not suggest connecting it mid-run. It is a
nice-to-have, not a step.

## Motion

Handled entirely by the template, and every template respects
`prefers-reduced-motion`. Do not add animation on top: unmeasured motion is how
a verified site becomes a janky one.

If someone wants noticeably more or less motion, that is a template choice, not
a tweak. Point them at a different template.
