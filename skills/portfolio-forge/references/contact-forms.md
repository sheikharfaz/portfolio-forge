# Contact forms

GitHub Pages is static. There is no server, so a form needs a third party or a
`mailto:`.

## Choosing

| Provider | Setup | Free tier | Use when |
|---|---|---|---|
| `formspree` | Sign up, create a form, copy the ID | 50 submissions/month | **Default.** Least setup, no client secrets |
| `emailjs` | Service + template + public key | 200/month | They already use it, or want templated email |
| `mailto` | Nothing | Unlimited | They prefer it, or refuse third parties |
| `none` | Nothing | — | Links only; common for senior people |

Default to `formspree`. If the user will not sign up for anything mid-run —
which is common and reasonable — use `mailto` and tell them how to upgrade
later. **Never stall a run waiting on a third-party signup.**

## Formspree

```json
{ "contact": { "provider": "formspree", "formspreeId": "mabcdefg" } }
```

The ID is public by design; it is in the form's action URL. That is not a leak.

The first submission to a new form requires email confirmation. Tell the user,
or they will think it is broken.

## EmailJS

```json
{
  "contact": {
    "provider": "emailjs",
    "emailjs": { "serviceId": "service_x", "templateId": "template_y", "publicKey": "AbC123" }
  }
}
```

The public key is designed to be public. **A private key is not** — if a user
offers one, refuse it and explain: anything in a client bundle is readable by
anyone who visits the site. Restrict abuse in the EmailJS dashboard by domain
allowlist instead.

## mailto

```json
{ "contact": { "provider": "mailto" } }
```

Uses `links.email`. Templates render it as a real button, not a bare address, so
it does not look like a fallback.

Its real flaw is people on webmail with no desktop client configured — the link
does nothing for them. Templates therefore show the address as copyable text
beside the button.

## Spam

Any published address gets scraped. Formspree filters server-side. For `mailto`,
templates render the address via a small runtime join rather than as plain text
in the HTML — imperfect, but it defeats the naive scrapers.

Never add a CAPTCHA the user did not ask for. It is a real accessibility cost
for a benefit they did not choose.
