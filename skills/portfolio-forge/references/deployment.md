# Phase 5 — Deployment

Only after `harness/verify.mjs` has exited 0.

## Confirm before you create anything

Creating a repository is public, permanent, and under the user's own name. Ask
every time, even if they said "just do it" earlier:

> Ready to publish. I'll create **`{login}/{repo}`** as a public repo and turn
> on GitHub Pages. Your site will be at
> `https://{login}.github.io/{repo}/`. Go ahead?

Check the name is free first — `gh repo view {login}/{repo}` returning 404 means
available. If it is taken, propose an alternative rather than failing.

**Private repos cannot publish Pages on a free account.** If they want private,
say so before creating it, not after the Pages call fails.

## Use the script

```bash
node scripts/deploy.mjs --profile ./profile.json --assets ./assets
```

It runs the harness first and refuses to create anything unless every gate
exits 0, so the ordering that makes the whole guarantee work is enforced in
code rather than left to you remembering it.

Inspect the plan without creating anything:

```bash
node scripts/deploy.mjs --profile ./profile.json --assets ./assets --dry-run
```

A dry run still verifies and still stages, so you can open the staged directory
and read exactly what would be published. It also downgrades a missing or
unauthenticated `gh` to a warning, since checking before installing anything is
the point.

| Flag | Effect |
|---|---|
| `--assets <dir>` | The user's images, laid out as the site's `public/` |
| `--out <dir>` | Where to stage; defaults to a temp directory |
| `--private` | Private repo. Pages will not publish from one on a free account |
| `--yes` | Skip the confirmation prompt. Only when the user already approved this exact repo name |
| `--skip-verify` | Publish without re-running the harness. Only right after a green run |
| `--allow-missing-assets` | Downgrade a missing referenced image to a warning |

What it does, in order: preflight `gh`, check the name is free, run the harness,
stage the site, confirm with the user, create the repo, push, enable Pages from
the workflow source, wait for the deploy, and poll the URL until it returns 200.

The site ships `.github/workflows/deploy.yml` already — templates include it.
Do not hand-roll one.

## The base path trap

A project site is served from `/{repo}/`, not `/`. A build made for `/` gives a
page with no CSS and no JS, which is the single most common way these deploys
fail.

Templates handle this: the shipped workflow derives `FORGE_BASE_PATH` from
`GITHUB_REPOSITORY` at build time, and drops it for a user site
(`{login}.github.io`), which is served from `/`. `scripts/smoke-stage.mjs`
asserts it in CI for every template, so it cannot regress silently.

You do not need to set it by hand. If you are adding a template, read
`FORGE_BASE_PATH` in its build config and nothing else.

`404.html` must be a copy of `index.html` for client-side routes to survive a
refresh. Templates handle this in their build; verify it landed in `dist/`.

## Custom domain

Set `site.domain` in the profile. The script commits `public/CNAME` and calls
the API — the committed file is the part that matters, because setting the
domain through the API alone is forgotten on the next deploy.

Their DNS needs:

- **Subdomain** → `CNAME` → `{login}.github.io.`
- **Apex** → four `A` records: `185.199.108.153`, `185.199.109.153`,
  `185.199.110.153`, `185.199.111.153`

DNS propagation takes minutes to hours and the HTTPS certificate is issued after
it resolves. Tell them the site works at the github.io URL meanwhile, so an
unpropagated domain does not read as a failure.

## Confirm it is actually live

The script polls the URL with backoff and only prints `Live` on a 200. A first
deploy can 404 for several minutes after the workflow goes green, so a
`Published, but not serving yet` result is normal rather than a failure — say
so plainly rather than presenting it as either success or breakage.

**Never report a URL you have not seen return 200.**

## Assets

Anything the profile references must be in the repo. The script refuses to
publish a profile that promises an image nothing ships, because the harness
cannot catch all of these: a template that does not render a field cannot break
on it, but the next template the user switches to will.

Pass `--assets <dir>` laid out like the site's `public/`, so
`images/avatar.webp` in the profile resolves to `<dir>/images/avatar.webp`.
