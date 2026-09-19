---
name: portfolio-forge
description: Build and deploy a complete animated portfolio website to the user's own GitHub Pages in a single run. Use when someone asks for a portfolio, personal site, or developer website built, generated, or deployed — or wants their existing one rebuilt.
---

# Portfolio Forge

Take someone from nothing to a live, verified portfolio URL on their own GitHub
account, in one run.

## The rule that makes this work

**You never write a site from scratch. You select a pre-tested template and
inject content into it.**

Every template in `templates/` already builds, is already accessible, and has
already been proven not to break at any breakpoint. Layout is never generated.
Content is. This is the only reason a run can promise a working site — a model
freehanding a React app is a coin flip, and the user is the one holding it.

If a template cannot express what the user wants, say so and offer the closest
one. Do not improvise a new layout mid-run.

## Run order

Work these phases in order. Do not skip ahead; each one depends on the last.

| Phase | Output | Reference |
|---|---|---|
| 0. Preflight | tools confirmed | `references/preflight.md` |
| 1. Profile | `profile.json`, user-approved | `references/profile-gathering.md` |
| 2. Template | one chosen, user-approved | `references/template-selection.md` |
| 3. Content | `profile.json` filled, schema-valid | `references/content-writing.md` |
| 4. Verify | all gates green | `references/verification.md` |
| 5. Deploy | live URL | `references/deployment.md` |
| 6. Handoff | user can maintain it | below |

Read a reference when you reach its phase, not before. They are detailed on
purpose; loading them all up front wastes the context you need for the user's
actual content.

## Two checkpoints you may never skip

1. **Profile approval.** Show the assembled profile and get an explicit yes
   before generating. Everything downstream is built on it.
2. **Repository creation.** Creating a repo on someone's GitHub account is
   public, permanent, and under their name. Confirm the repo name and the
   public/private choice before the call, every time, even if they said "just
   do it" earlier.

Between those two, work without interrupting. That is the point of the tool.

## What to reach for

The knowledge of which tool does what is the product here. Do not guess:

| Need | Use |
|---|---|
| What the user does, has built, writes like | `references/profile-gathering.md` — memory, GitHub API, resume, interview |
| Visual direction, palettes, design tokens | `references/design-direction.md` |
| Contact form that works with no backend | `references/contact-forms.md` |
| Images, avatars, OG cards, optimisation | `references/assets.md` |
| Does it actually work | `harness/verify.mjs` — never your own judgement alone |
| Repo, Pages, custom domain, DNS | `references/deployment.md` |
| A gate failed and you must fix it | `references/troubleshooting.md` |

Three subagents exist for the heavy parallel work — `content-writer`,
`verifier`, `deployer`. Use them; they keep this conversation's context free for
talking to the user.

## The loop that guarantees a working site

```
content → harness/verify.mjs → green? → deploy
                             → red?   → diagnose → fix → retry (max 3)
                                                      → still red? → fall back
```

**Nothing is pushed until the harness exits 0.** Not "it looks fine", not "the
build passed" — exit 0 from `harness/verify.mjs`.

Almost every failure is content-shaped, and the fix is almost always to shorten
something rather than to loosen a bound. `references/troubleshooting.md` maps
each gate's failures to its fix.

After three failed rounds on the same template, stop retrying. Offer the
`minimal` template, which has the widest tolerances, and say plainly why.
**Shipping a broken site is never the fallback.**

## Handoff

End the run with:

- The live URL, and the note that a first Pages deploy can take a few minutes to
  propagate even after the workflow goes green.
- The repo URL.
- How to change things: edit `profile.json`, push, Pages rebuilds. Most updates
  never need this skill again.
- How to re-run this skill to switch template or redesign.
- Anything you deliberately left out, and why.

## Honesty rules

- If the site has a rough edge, say so. A user who finds it themselves trusts
  nothing else you said.
- Never claim a gate passed that you did not run.
- If you could not get something (no GitHub history, no resume), say what is
  thin rather than inventing detail. **Never fabricate a project, a job, a date,
  or a metric.** This is going out under the user's real name — fabrication here
  is not a rough edge, it is a lie on someone's professional record.
