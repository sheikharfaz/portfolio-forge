# Phase 1 — Profile gathering

Goal: a complete, **true**, user-approved `profile.json`.

## Sources, best first

### 1. What you already know

If this conversation has memory of the user, open with it. Do not interrogate
someone about facts you already hold:

> Here's what I already know about you — correct anything wrong and fill the
> gaps: you're a full-stack developer working mostly in React and Python,
> you've been building AI tooling for about two years, and you write in a
> direct, low-jargon style. Right?

This is the moment that makes the tool feel like magic. Lead with it.

**But never depend on it.** Most people running this plugin are strangers whose
context holds nothing about them. Memory is a shortcut when present, never a
requirement.

### 2. GitHub — the highest-signal public source

```bash
gh api user
gh api users/{login}/repos --paginate -q \
  '[.[] | select(.fork==false) | {name, description, language, stars: .stargazers_count, topics, updated: .pushed_at, url: .html_url}] | sort_by(-.stars)'
```

For the top handful, read the README's opening paragraph — it is usually a
better project summary than anything you would infer from the repo name.

Stars are a weak signal. Recency, README quality and whether the user talks
about it matter more. **Ask which projects they actually want shown.** Someone's
most-starred repo is often a throwaway gist and their best work is private.

### 3. A resume or CV

If they have a PDF or DOCX, read it. It is the densest source of dates, titles
and employers — exactly the fields that are tedious to ask for and embarrassing
to get wrong.

### 4. An existing site

If they already have one, fetch it. Tone, section structure and project copy are
all reusable, and it tells you what they already chose to emphasise.

### 5. The interview — for what nothing else gives

Ask in **one batch**, not a drip. Six questions, maximum:

1. Who is this site for — recruiters, clients, collaborators, or a general
   audience? *(Drives everything below.)*
2. Which three projects should lead?
3. What should someone do after landing — email you, read your code, book a
   call?
4. Tone: understated and precise, or bold and expressive?
5. Anything to leave off? *(Current employer, location, an old job.)*
6. Do you have a domain, or should this live at
   `{login}.github.io/{repo}`?

## Never fabricate

Not a project, not a date, not a job title, not a metric, not a testimonial.
This publishes under the user's real name and it is the one failure that cannot
be walked back.

If a section is thin, the answer is to drop the section, not to pad it. A site
with three real projects beats one with three real and two invented.

Where you inferred rather than were told, say so at approval time: *"I pulled
these three from your GitHub and wrote the summaries myself — check them."*

## Approval

Show the profile as readable prose, not raw JSON. Ask for corrections. Get an
explicit yes.

Then write `profile.json` and validate before going further:

```bash
node harness/validate-profile.mjs profile.json --template templates/<name>
```

Fix anything it flags now. A failure here costs seconds; the same failure after
a build costs minutes.
