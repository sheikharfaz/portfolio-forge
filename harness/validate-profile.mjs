#!/usr/bin/env node
/**
 * Gate 0 — schema.
 *
 * The cheapest gate and the one that prevents the most damage. Generated copy
 * that would overflow a slot is rejected here, in milliseconds, before a build
 * is ever attempted. Every other gate exists to catch what this one cannot.
 *
 *   node harness/validate-profile.mjs <profile.json> [--template templates/<name>]
 */

import { readFile } from 'node:fs/promises';
import { resolve as resolvePath, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import { applyConstraints } from './lib/constraints.mjs';
import { finding, pass, fail, SEVERITY } from './lib/report.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE_SCHEMA = join(HERE, '..', 'schema', 'profile.schema.json');

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));

/**
 * @param {object} profile
 * @param {string|null} templateDir
 */
export async function validateProfile(profile, templateDir = null) {
  const base = await readJson(BASE_SCHEMA);

  let schema = base;
  if (templateDir) {
    const manifest = await readJson(join(templateDir, 'template.json'));
    const { schema: narrowed, errors } = applyConstraints(base, manifest.constraints);
    if (errors.length) {
      return fail(
        'schema',
        errors.map((message) =>
          finding({
            gate: 'schema',
            where: `${templateDir}/template.json`,
            message,
            fix: 'A template constraint must be stricter than the base schema. See templates/README.md.',
          })
        )
      );
    }
    schema = narrowed;

    const supported = manifest.capabilities?.contactProviders;
    const wanted = profile.contact?.provider;
    if (supported && wanted && !supported.includes(wanted)) {
      return fail(
        'schema',
        finding({
          gate: 'schema',
          where: 'contact.provider',
          message: `Template "${manifest.name}" does not support the "${wanted}" contact provider (supports: ${supported.join(', ')}).`,
          fix: `Set contact.provider to one of ${supported.join(', ')}, or pick a template that supports it.`,
        })
      );
    }
  }

  const ajv = new Ajv({ allErrors: true, strict: false, verbose: true });
  addFormats(ajv);

  const validate = ajv.compile(schema);
  if (validate(profile)) return pass('schema');

  const findings = validate.errors.map((e) => {
    const where = `profile${e.instancePath || ''}`;
    // Length overflow is by far the most common failure, and it has a specific fix.
    if (e.keyword === 'maxLength') {
      const actual = typeof e.data === 'string' ? e.data.length : '?';
      return finding({
        gate: 'schema',
        where,
        message: `${actual} characters; this slot holds ${e.params.limit}.`,
        fix: `Rewrite to ${e.params.limit} characters or fewer. Do not widen the bound — the layout was measured for it.`,
      });
    }
    if (e.keyword === 'maxItems') {
      return finding({
        gate: 'schema',
        where,
        message: `${e.data?.length ?? '?'} items; this template renders at most ${e.params.limit}.`,
        fix: `Keep the ${e.params.limit} strongest and drop the rest, or choose a template with more room.`,
      });
    }
    if (e.keyword === 'additionalProperties') {
      return finding({
        gate: 'schema',
        where: `${where}/${e.params.additionalProperty}`,
        message: 'Unknown field. The profile schema is closed so typos surface here instead of silently vanishing from the site.',
        fix: 'Remove it, or add it to schema/profile.schema.json if it is genuinely new.',
      });
    }
    return finding({
      gate: 'schema',
      where,
      message: `${e.message}${e.params ? ` (${JSON.stringify(e.params)})` : ''}`,
    });
  });

  return fail('schema', findings);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const profilePath = args.find((a) => !a.startsWith('--'));
  const tIndex = args.indexOf('--template');
  const templateDir = tIndex === -1 ? null : resolvePath(args[tIndex + 1]);

  if (!profilePath) {
    console.error('usage: validate-profile.mjs <profile.json> [--template templates/<name>]');
    process.exit(2);
  }

  const { printReport } = await import('./lib/report.mjs');
  const result = await validateProfile(await readJson(resolvePath(profilePath)), templateDir);
  process.exit(printReport([result]) ? 0 : 1);
}
