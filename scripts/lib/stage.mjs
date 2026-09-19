/**
 * Builds the directory that becomes the user's repository.
 *
 * Kept separate from the deploy orchestration so it can be tested without
 * creating anything on anyone's GitHub account. What lands here is what they
 * will read, fork and edit for years, so it carries no Forge machinery: no
 * template.json, no preview image, no fixture assets.
 */

import { cp, mkdir, writeFile, rm, access } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const exists = (p) => access(p).then(() => true, () => false);

/** Forge metadata and build artefacts that must not reach the user's repo. */
const EXCLUDE_NAMES = new Set([
  'node_modules',
  'dist',
  'template.json',
  'preview.png',
  'preview.webp',
  '.harness-backup',
]);

function isExcluded(templateDir, src) {
  const rel = relative(templateDir, src);
  if (!rel) return false;
  return rel.split(sep).some((part) => EXCLUDE_NAMES.has(part) || part.endsWith('.harness-backup'));
}

function siteReadme(profile) {
  const { identity, site } = profile;
  return `# ${identity.name} — portfolio

${profile.bio.short}

## Updating the site

Everything on this site is driven by one file: \`src/profile.json\`.

1. Edit it.
2. Commit and push to \`main\`.
3. GitHub Actions rebuilds and redeploys automatically.

Most changes — new project, new job, different accent colour, reordered
sections — need nothing but that file.

### Running it locally

\`\`\`bash
npm ci
npm run dev
\`\`\`

### Field limits

\`src/profile.json\` has length limits per field, and they are not arbitrary:
each one is the width the layout was measured for. Copy that exceeds them will
clip or overflow on small screens rather than fail loudly, so keep edits inside
roughly the length of what is already there.

## Deployment

Pushes to \`main\` trigger \`.github/workflows/deploy.yml\`, which builds the site
and publishes it to GitHub Pages. The base path is derived from the repository
name at build time, so renaming the repo keeps working.

---

Generated with [Portfolio Forge](https://github.com/sheikharfaz/portfolio-forge)
from the \`${site.template}\` template. The site is yours — MIT licensed, no
attribution required. Remove this file whenever you like.
`;
}

/**
 * Every local asset the profile promises, as paths relative to public/.
 * Remote https assets are somebody else's uptime and are left alone.
 */
export function referencedAssets(profile) {
  const out = [];
  const take = (asset) => {
    if (asset?.src && !/^https?:\/\//.test(asset.src)) out.push(asset.src.replace(/^\/+/, ''));
  };

  take(profile.identity?.avatar);
  take(profile.seo?.ogImage);
  for (const project of profile.projects ?? []) take(project.media);

  return [...new Set(out)];
}

/**
 * @param {{ templateDir: string, profile: object, outDir: string, assetsDir?: string, force?: boolean }} options
 * @returns {Promise<{ outDir: string, wrote: string[], missingAssets: string[] }>}
 */
export async function stageSite({ templateDir, profile, outDir, assetsDir = null, force = false }) {
  if (await exists(outDir)) {
    if (!force) throw new Error(`Staging directory already exists: ${outDir}. Pass force to replace it.`);
    await rm(outDir, { recursive: true, force: true });
  }
  await mkdir(outDir, { recursive: true });

  await cp(templateDir, outDir, {
    recursive: true,
    filter: (src) => !isExcluded(templateDir, src),
  });

  const wrote = [];

  // The user's own images. They live outside the template so a run never
  // mutates the installed plugin — which would also make concurrent runs
  // stomp on each other.
  if (assetsDir && (await exists(assetsDir))) {
    await cp(assetsDir, join(outDir, 'public'), { recursive: true });
    wrote.push('public/ (assets)');
  }

  // The profile is the site's only content source, and the one file the user
  // will actually edit later.
  const profilePath = join(outDir, 'src', 'profile.json');
  await mkdir(join(outDir, 'src'), { recursive: true });
  await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`);
  wrote.push('src/profile.json');

  await writeFile(join(outDir, 'README.md'), siteReadme(profile));
  wrote.push('README.md');

  // A CNAME only counts when it is committed; setting the domain through the
  // API alone is forgotten on the next deploy.
  if (profile.site.domain) {
    await mkdir(join(outDir, 'public'), { recursive: true });
    await writeFile(join(outDir, 'public', 'CNAME'), `${profile.site.domain}\n`);
    wrote.push('public/CNAME');
  }

  if (!(await exists(join(outDir, '.github', 'workflows', 'deploy.yml')))) {
    throw new Error(
      `Template ${templateDir} ships no .github/workflows/deploy.yml. ` +
        'Without it the published repository never builds. See templates/README.md.'
    );
  }

  if (!(await exists(join(outDir, 'package-lock.json')))) {
    throw new Error(
      `Template ${templateDir} ships no package-lock.json. ` +
        'The deploy workflow runs npm ci, which requires one.'
    );
  }

  // An asset the profile promises but the repo does not carry is a broken
  // image on someone's live site. The harness cannot catch every one of these,
  // because a template that does not render a field cannot break on it — but
  // the next template the user switches to will.
  const missingAssets = [];
  for (const asset of referencedAssets(profile)) {
    if (!(await exists(join(outDir, 'public', asset)))) missingAssets.push(asset);
  }

  return { outDir, wrote, missingAssets };
}
