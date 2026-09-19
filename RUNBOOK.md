# Running a full build, end to end

Everything below runs on your own machine. Portfolio Forge publishes to *your*
GitHub account, so it needs *your* credentials — there is no hosted service and
nothing is uploaded anywhere.

## Once

```bash
# GitHub CLI, authenticated
gh auth login                    # choose HTTPS, authorise in the browser
gh auth status                   # should print your account

# The repo, and the verification harness
git clone https://github.com/sheikharfaz/portfolio-forge
cd portfolio-forge
cd harness && npm ci && npx playwright install chromium && cd ..

node scripts/preflight.mjs       # confirms node, git, gh, scopes
```

`preflight.mjs` exits non-zero and tells you exactly what is missing. Fix that
before anything else — failing here costs two minutes, failing at the deploy
step costs the whole run.

## Every run

### 1. Write a profile

Start from a fixture and edit it:

```bash
cp schema/fixtures/sparse.json profile.json
```

Set at minimum `identity`, `bio.short`, `links`, `site.template` and
`site.repoName`. If you already have a repo called `portfolio`, pick a
different `repoName` — the deploy script checks and suggests free names, but
choosing deliberately is better than being told.

Optionally seed it from an assistant export first:

```bash
node scripts/import-memory.mjs --input ~/Downloads/claude-export
```

### 2. Check it fits

```bash
node harness/validate-profile.mjs profile.json --template templates/minimal
```

Milliseconds, and it catches the content-shaped problems before any build.

Milliseconds, and it catches the content-shaped problems before any build.
An overflow finding means shorten the copy, not widen the bound.

### 3. See what would be published

```bash
node scripts/deploy.mjs --profile ./profile.json --assets ./assets --dry-run
```

This runs every gate and stages the whole site **without creating anything**.
Open the staged directory it prints and read it.

`--assets` points at a folder laid out like the site's `public/`, so an avatar
at `images/avatar.webp` in your profile lives at `assets/images/avatar.webp`.
Omit the flag if your profile references no local images.

### 4. Publish

```bash
node scripts/deploy.mjs --profile ./profile.json --assets ./assets
```

It verifies again, asks before creating the repository, pushes, enables Pages,
waits for the deploy, and polls the URL until it returns 200.

It will not create anything unless every gate passes. That is the point.

## Afterwards

Your site is a normal repository you own. To change anything, edit
`src/profile.json` in *that* repo and push — Actions rebuilds and redeploys.
Most updates never need this tool again.

## When something fails

| Symptom | Look at |
|---|---|
| A gate failed | `skills/portfolio-forge/references/troubleshooting.md` |
| Published page is blank and unstyled | The base path. `references/deployment.md` |
| URL 404s right after a green deploy | Normal for a few minutes. Retry before worrying |
| `gh` not authenticated | `gh auth refresh -h github.com -s repo,workflow` |
| Pages will not enable | Private repo on a free account cannot publish Pages |

## Timings

| Template | Verify | Total run |
|---|---|---|
| `minimal` | ~15s | 3–5 min |
| `terminal` | ~15s | 3–5 min |
| `aurora` | ~20s | 4–7 min |

Most of a run is the first `npm ci` and the Pages deploy, not the gates.
