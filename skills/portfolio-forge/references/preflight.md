# Phase 0 — Preflight

Two minutes here saves a failure eight minutes in, after the user has already
answered twenty questions. Check everything before asking them anything.

## Required

```bash
node --version          # >= 20.11.0
git --version
gh auth status          # must print a logged-in account
```

`gh` is how the repo gets created and Pages gets enabled. Without it there is no
deploy, so establish this first.

- **No `gh`** → install: `brew install gh` / `winget install GitHub.cli` /
  see cli.github.com. Then `gh auth login`.
- **`gh` present but not authenticated** → `gh auth login`, choose HTTPS, and
  let it authenticate via browser.
- **Authenticated but missing scopes** → creating a repo and enabling Pages
  needs `repo` and `workflow`: `gh auth refresh -h github.com -s repo,workflow`.
- **Node too old** → say which version they have and what is needed. Do not try
  to work around it; the templates pin toolchains for a reason.

Capture the account name from `gh api user --jq .login`. It determines the
published URL and prefills the profile.

## Browsers for the harness

```bash
cd harness && npm ci && npx playwright install chromium
```

The first run downloads a browser, which is slow. Do it during preflight, not at
the verification gate where the user is already waiting.

If Chromium is already provided by the environment (`PLAYWRIGHT_BROWSERS_PATH`
is set), skip the install — it is already there.

## Tell the user what is about to happen

Before the interview, set expectations in three lines:

- Roughly how long (4–8 minutes for a static template, 10–15 with WebGL).
- That a **public** repo will be created on their account, with their approval.
- That they can change anything afterwards by editing one JSON file.

People accept a long wait they were warned about and resent a short one they
were not.
