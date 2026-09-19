# Phase 3 — Content writing

Turning the profile's facts into copy that fits the slots and sounds like the
user.

## Write to the bound, not to the limit

Every field has a `maxLength`. It is a hard ceiling, not a target. Copy that
lands at exactly 140 of 140 characters looks cramped and breaks the moment
anyone edits it. **Aim for roughly 80% of the bound.**

The bounds exist because someone measured the slot. Shorten the copy; never
widen the bound.

## Slot by slot

**`identity.headline`** (≤60) — what they do, in the words their field actually
uses. "Full Stack AI Developer" beats "Passionate technologist crafting digital
experiences". Cut every adjective that would survive being deleted.

**`identity.tagline`** (≤90) — optional, and genuinely optional. Use it for
something specific and true, or leave it out. A generic tagline is worse than
none.

**`bio.short`** (≤180) — third person or first, consistently. Used as the SEO
description, so it should read well stripped of all context.

**`bio.long`** (≤800) — the one place for voice. Specific beats grand: what they
work on, how they got there, what they care about. No "passionate about
leveraging cutting-edge technologies."

**`projects[].summary`** (≤140) — what it does and why it is interesting, in one
sentence. Lead with the outcome, not the stack. "Groups your tabs by project so
you stop losing them" beats "A browser extension built with the WebExtensions
API."

**`experience[].highlights`** (≤120 each) — concrete and measured where a real
number exists. If no real number exists, describe the change without inventing
one. "Cut p99 write latency by 62%" is excellent; "Improved performance
significantly" is filler; a fabricated percentage is misconduct.

## Voice

Match the user. If their GitHub READMEs are terse and dry, write terse and dry.
If their existing writing is playful, be playful. A portfolio that sounds
nothing like the person fails at an interview.

Default when you have no signal: plain, direct, concrete. It is the hardest
register to get wrong.

## Words to delete on sight

passionate, leverage, cutting-edge, seamless, robust, innovative, synergy,
game-changing, "I'm a X who loves Y", "turning ideas into reality", "let's build
something amazing together".

These read as filler to exactly the audience the site is for.

## Then validate

```bash
node harness/validate-profile.mjs profile.json --template templates/<name>
```

An overflow finding means rewrite the field. It does not mean edit the schema.
