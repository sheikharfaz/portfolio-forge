#!/usr/bin/env node
/**
 * Phase 5 — publish a verified site to the user's own GitHub Pages.
 *
 *   node scripts/deploy.mjs --profile ./profile.json
 *   node scripts/deploy.mjs --profile ./profile.json --dry-run
 *
 * Refuses to create anything until the harness has exited 0 on this exact
 * profile. That ordering is the whole guarantee: a URL handed to someone is a
 * URL that was checked first.
 */

import { readFile, mkdtemp } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve, join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';

import { stageSite } from './lib/stage.mjs';
import { green, red, yellow, dim } from '../harness/lib/report.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));

function run(command, args, { cwd = ROOT, capture = true, timeout = 600_000 } = {}) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, { cwd, shell: false, stdio: capture ? 'pipe' : 'inherit' });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => (stdout += d));
    child.stderr?.on('data', (d) => (stderr += d));

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolvePromise({ code: 124, stdout, stderr: `${stderr}\n[deploy] timed out after ${timeout}ms` });
    }, timeout);

    child.on('error', (err) => { clearTimeout(timer); resolvePromise({ code: 127, stdout, stderr: String(err) }); });
    child.on('close', (code) => { clearTimeout(timer); resolvePromise({ code, stdout: stdout.trim(), stderr: stderr.trim() }); });
  });
}

const die = (message, hint) => {
  console.error(`\n${red('Cannot deploy')}  ${message}`);
  if (hint) console.error(dim(`  ${hint}`));
  process.exit(1);
};

function parseArgs(argv) {
  const out = { flags: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) out.flags.add(key);
    else { out[key] = next; i++; }
  }
  return out;
}

async function confirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`${question} [y/N] `);
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = args.flags.has('dry-run');
  const assumeYes = args.flags.has('yes');

  if (!args.profile) die('No --profile given.', 'usage: deploy.mjs --profile ./profile.json [--dry-run] [--yes]');

  const profilePath = resolve(args.profile);
  const profile = await readJson(profilePath);
  const templateDir = resolve(args['templates-dir'] || join(ROOT, 'templates'), profile.site.template);
  const repoName = profile.site.repoName;
  const visibility = args.flags.has('private') ? 'private' : 'public';

  // --- preflight -----------------------------------------------------------

  // A dry run is precisely what someone does before installing anything, so a
  // missing or unauthenticated gh is a warning there and fatal everywhere else.
  const blocker = dryRun
    ? (message, hint) => { console.log(yellow(`\nwarning  ${message}`)); if (hint) console.log(dim(`         ${hint}`)); }
    : die;

  const auth = await run('gh', ['auth', 'status']);
  if (auth.code === 127) blocker('The GitHub CLI (gh) is not installed.', 'https://cli.github.com — then: gh auth login');
  else if (auth.code !== 0) blocker('gh is not authenticated.', 'Run: gh auth login');

  let login = args.login || null;
  if (!login) {
    const me = await run('gh', ['api', 'user', '--jq', '.login']);
    if (me.code === 0) login = me.stdout;
    else if (dryRun) login = '<your-github-login>';
    else die('Could not read the authenticated GitHub account.', me.stderr);
  }

  const isUserSite = repoName.toLowerCase() === `${login.toLowerCase()}.github.io`;
  const siteUrl = isUserSite ? `https://${login}.github.io/` : `https://${login}.github.io/${repoName}/`;

  if (visibility === 'private') {
    console.log(yellow('\nNote: GitHub Pages does not publish from a private repository on a free account.'));
  }

  // Most people running this already have a repo called `portfolio`, so a bare
  // "that name is taken" is a dead end. Offer names that are actually free.
  const free = async (name) => (await run('gh', ['repo', 'view', `${login}/${name}`, '--json', 'name'])).code !== 0;

  if (!(await free(repoName))) {
    const year = new Date().getFullYear();
    const candidates = [
      `${repoName}-site`,
      `${repoName}-${year}`,
      `${login}-portfolio`,
      'personal-site',
      `${login}.github.io`,
    ];

    const available = [];
    for (const candidate of candidates) {
      if (candidate === repoName) continue;
      if (await free(candidate)) available.push(candidate);
      if (available.length === 3) break;
    }

    const suggestion = available.length
      ? `Names that are free on your account right now: ${available.join(', ')}.` +
        (available.includes(`${login}.github.io`)
          ? ` Note ${login}.github.io publishes at the root of your GitHub Pages domain, not under a path.`
          : '')
      : 'Every name tried is taken — pick your own.';

    blocker(`${login}/${repoName} already exists.`, `Set site.repoName to something else. ${suggestion}`);
  }

  // --- the gate ------------------------------------------------------------

  if (args.flags.has('skip-verify')) {
    console.log(yellow('\n--skip-verify: publishing without running the harness. Only do this when you just ran it.'));
  } else {
    console.log(dim(`\nVerifying ${profile.site.template} against this profile…`));
    // The assets have to reach the harness too. Verifying without them checks
    // a site that is not the one being published, and a real avatar fails the
    // broken-image gate that staging would have satisfied.
    const verifyArgs = [join(ROOT, 'harness', 'verify.mjs'), '--template', templateDir, '--profile', profilePath];
    if (args.assets) verifyArgs.push('--assets', resolve(args.assets));
    const verify = await run('node', verifyArgs, { capture: false });
    if (verify.code !== 0) {
      die('The harness did not pass, so nothing was published.',
        'Fix the findings above and run again. See skills/portfolio-forge/references/troubleshooting.md.');
    }
  }

  // --- stage ---------------------------------------------------------------

  const outDir = args.out ? resolve(args.out) : join(await mkdtemp(join(tmpdir(), 'forge-')), repoName);
  const assetsDir = args.assets ? resolve(args.assets) : null;
  const { wrote, missingAssets } = await stageSite({ templateDir, profile, outDir, assetsDir, force: true });

  console.log(`\n${dim('staged')}    ${outDir}`);
  for (const file of wrote) console.log(dim(`           + ${file}`));

  if (missingAssets.length) {
    const list = missingAssets.map((a) => `    ${a}`).join('\n');
    const hint = `Pass --assets <dir> pointing at a folder laid out like the site's public/, ` +
      `or remove the media field from profile.json. Shipping a promise of an image the repo does not carry ` +
      `is a broken image on a live site.`;
    if (args.flags.has('allow-missing-assets')) {
      console.log(yellow(`\nwarning  ${missingAssets.length} referenced asset(s) are not staged:\n${list}`));
      console.log(dim(`         ${hint}`));
    } else {
      die(`${missingAssets.length} asset(s) referenced by the profile are missing:\n${list}`, hint);
    }
  }

  // --- confirm -------------------------------------------------------------

  console.log(`\n  repository  ${login}/${repoName}  (${visibility})`);
  console.log(`  site        ${siteUrl}`);

  if (dryRun) {
    console.log(`\n${yellow('Dry run — nothing was created.')} The staged site above is ready to inspect.`);
    return;
  }

  if (!assumeYes) {
    console.log('');
    const ok = await confirm(`Create ${login}/${repoName} as a ${visibility} repository and publish?`);
    if (!ok) {
      console.log(`\nStopped. Nothing was created. The staged site is at ${outDir}`);
      process.exit(1);
    }
  }

  // --- publish -------------------------------------------------------------

  const created = await run('gh', ['repo', 'create', `${login}/${repoName}`,
    `--${visibility}`, '--description', `Personal portfolio — ${profile.identity.headline}`, '--disable-wiki']);
  if (created.code !== 0) die('Could not create the repository.', created.stderr);
  console.log(green(`\ncreated    ${login}/${repoName}`));

  const git = async (...a) => {
    const r = await run('git', a, { cwd: outDir });
    if (r.code !== 0) die(`git ${a[0]} failed.`, r.stderr);
    return r;
  };

  await git('init', '-b', 'main');
  await git('add', '-A');
  await git('-c', 'commit.gpgsign=false', 'commit', '-m', 'Initial portfolio');
  await git('remote', 'add', 'origin', `https://github.com/${login}/${repoName}.git`);

  // Network flakes here are worth a retry; everything up to this point is not
  // cheap to repeat.
  let pushed = false;
  for (const delay of [0, 2000, 4000, 8000, 16000]) {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    const push = await run('git', ['push', '-u', 'origin', 'main'], { cwd: outDir });
    if (push.code === 0) { pushed = true; break; }
    console.log(yellow(`push failed, retrying… ${push.stderr.split('\n').slice(-1)[0]}`));
  }
  if (!pushed) die('Could not push to the new repository.', `The staged site is at ${outDir} — you can push it by hand.`);
  console.log(green('pushed     main'));

  // Pages must be sourced from the workflow, not the legacy branch source.
  const pagesArgs = ['api', '-X', 'POST', `repos/${login}/${repoName}/pages`, '-f', 'build_type=workflow'];
  let pages = await run('gh', pagesArgs);
  if (pages.code !== 0) {
    pages = await run('gh', ['api', '-X', 'PUT', `repos/${login}/${repoName}/pages`, '-f', 'build_type=workflow']);
  }
  if (pages.code !== 0) {
    console.log(yellow('\nCould not enable Pages automatically.'));
    console.log(dim(`  Enable it at https://github.com/${login}/${repoName}/settings/pages — source: GitHub Actions.`));
  } else {
    console.log(green('enabled    GitHub Pages (source: Actions)'));
  }

  if (profile.site.domain) {
    const cname = await run('gh', ['api', '-X', 'PUT', `repos/${login}/${repoName}/pages`,
      '-f', `cname=${profile.site.domain}`, '-F', 'https_enforced=true']);
    if (cname.code !== 0) console.log(yellow(`  Custom domain not applied automatically: ${cname.stderr.split('\n')[0]}`));
  }

  // --- wait for it to actually be live -------------------------------------

  console.log(dim('\nwaiting for the first deploy…'));
  await run('gh', ['run', 'watch', '--exit-status'], { cwd: outDir, capture: false, timeout: 900_000 });

  // A first deploy commonly 404s for a few minutes after the workflow goes
  // green. Reporting a URL that is not yet serving is the worst possible
  // ending to a run that otherwise worked.
  let status = 0;
  for (const delay of [0, 5000, 10000, 20000, 30000, 30000]) {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    const probe = await run('curl', ['-sSL', '-o', '/dev/null', '-w', '%{http_code}', siteUrl], { timeout: 30_000 });
    status = Number(probe.stdout);
    if (status === 200) break;
    console.log(dim(`  ${status || 'no response'} — retrying`));
  }

  console.log('');
  if (status === 200) {
    console.log(`${green('Live')}  ${siteUrl}`);
  } else {
    console.log(`${yellow('Published, but not serving yet')}  ${siteUrl}`);
    console.log(dim('  A first Pages deploy can take several minutes to propagate. Check again shortly.'));
  }
  console.log(dim(`repo  https://github.com/${login}/${repoName}`));
  if (profile.site.domain) {
    console.log(dim(`\nFor ${profile.site.domain}, point DNS at GitHub:`));
    console.log(dim('  subdomain → CNAME → ' + login + '.github.io.'));
    console.log(dim('  apex      → A → 185.199.108.153, .109.153, .110.153, .111.153'));
    console.log(dim('  Propagation takes minutes to hours; the github.io URL works meanwhile.'));
  }
}

main().catch((err) => {
  console.error(`\n${red('Deploy crashed')} — this is a bug in deploy.mjs, not in your site.\n`);
  console.error(err);
  process.exit(3);
});
