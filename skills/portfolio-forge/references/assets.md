# Assets

Everything a generated site loads must be committed to the repo. No CDN links,
no hotlinked images, no third-party fonts at runtime. The `runtime` gate fails a
site that reaches off-origin, and that is deliberate: it keeps the site working
behind a strict CSP, keeps it fast, and stops it leaking visitors to a third
party the owner never chose.

## Avatar

- Ask for one. Do not generate a likeness of a real person, ever.
- Square, at least 512x512, converted to WebP.
- No photo is fine. Templates fall back to typographic initials, which looks
  deliberate rather than missing.

```bash
npx --yes sharp-cli -i input.jpg -o public/images/avatar.webp resize 512 512 --fit cover -f webp
```

## Project images

Screenshots of real work, from the user. Failing that, omit the image —
templates render text-only project cards properly, and a stock photo of a laptop
is worse than nothing.

Target 1200px wide, WebP, under 200KB. Always set `alt`; the a11y gate fails
without it and a screen reader user gets nothing.

## OG image

The preview card on social and chat. Worth getting right — it is often the first
thing anyone sees.

1200x630, WebP or PNG, with the name and headline as **real text baked into the
image**, since alt text is not rendered in a preview card.

If none is supplied, templates generate one at build time from `identity.name`
and `identity.headline` on the accent colour. That is usually good enough.

## Fonts

Self-hosted, in `public/fonts/`, WOFF2, subset to Latin unless the content needs
more. Templates ship with their own; do not swap one in mid-run, because type
scale and line height were tuned around it.

Never link Google Fonts at runtime. It is a render-blocking request to a third
party, and on a strict CSP it simply fails.

## 3D models

Only relevant to WebGL templates, which ship their own. If a user supplies one:

- Single-file `.glb`, Draco-compressed geometry, WebP textures.
- Under 3MB. Above that the mobile fallback is the only honest option.
- Check the licence permits redistribution — it is about to be committed to a
  public repo under the user's name. Record attribution in
  `public/models/LICENSES.md`.

## Licensing

Every third-party asset needs a licence that allows redistribution. If you
cannot confirm one, do not include it. Explaining a takedown notice is a worse
conversation than "your site has no hero image".
