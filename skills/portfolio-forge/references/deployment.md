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

## The sequence

```bash
# 1. Repo
gh repo create "{login}/{repo}" --public --description "Personal portfolio" --disable-wiki

# 2. Local repo from the generated site
cd "$OUT_DIR"
git init -b main
git add -A
git commit -m "Initial portfolio"
git remote add origin "https://github.com/{login}/{repo}.git"
git push -u origin main

# 3. Pages via Actions (not the legacy branch source)
gh api -X POST "repos/{login}/{repo}/pages" -f "build_type=workflow" 2>/dev/null \
  || gh api -X PUT "repos/{login}/{repo}/pages" -f "build_type=workflow"

# 4. Watch the deploy
gh run watch --exit-status
```

The site ships `.github/workflows/deploy.yml` already — templates include it.
Do not hand-roll one.

## The base path trap

A project site is served from `/{repo}/`, not `/`. A build made for `/` gives a
page with no CSS and no JS, which is the single most common way these deploys
fail.

Set the base path before building:

- Vite → `base: '/{repo}/'` in `vite.config.js`
- Next static export → `basePath` and `assetPrefix`

A user site (`{login}.github.io`) is served from `/` and must **not** have a base
path. Get this from the repo name, not from assumption.

`404.html` must be a copy of `index.html` for client-side routes to survive a
refresh. Templates handle this in their build; verify it landed in `dist/`.

## Custom domain

```bash
echo "portfolio.example.com" > public/CNAME     # committed, or Pages forgets it
gh api -X PUT "repos/{login}/{repo}/pages" -f "cname=portfolio.example.com" -F "https_enforced=true"
```

Their DNS needs:

- **Subdomain** → `CNAME` → `{login}.github.io.`
- **Apex** → four `A` records: `185.199.108.153`, `185.199.109.153`,
  `185.199.110.153`, `185.199.111.153`

DNS propagation takes minutes to hours and the HTTPS certificate is issued after
it resolves. Tell them the site works at the github.io URL meanwhile, so an
unpropagated domain does not read as a failure.

## Confirm it is actually live

```bash
curl -sS -o /dev/null -w '%{http_code}' "https://{login}.github.io/{repo}/"
```

A first deploy can 404 for a few minutes after the workflow goes green. Retry a
few times before reporting a problem, and say this to the user either way.

**Never report a URL you have not seen return 200.**
