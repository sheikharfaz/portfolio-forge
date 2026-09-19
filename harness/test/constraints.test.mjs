import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyConstraints } from '../lib/constraints.mjs';
import { validateProfile } from '../validate-profile.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));
const base = () => readJson(join(ROOT, 'schema', 'profile.schema.json'));

test('a template may narrow a string bound', async () => {
  const { schema, errors } = applyConstraints(await base(), {
    'identity.headline': { maxLength: 48 },
  });
  assert.deepEqual(errors, []);
  assert.equal(schema.properties.identity.properties.headline.maxLength, 48);
});

test('a template may narrow an array bound', async () => {
  const { schema, errors } = applyConstraints(await base(), { projects: { maxItems: 6 } });
  assert.deepEqual(errors, []);
  assert.equal(schema.properties.projects.maxItems, 6);
});

test('a template may not widen a bound', async () => {
  const { errors } = applyConstraints(await base(), {
    'identity.headline': { maxLength: 200 },
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /widens the base schema/);
});

test('a constraint on an unknown path is an error, not a silent no-op', async () => {
  const { errors } = applyConstraints(await base(), { 'identity.nonsense': { maxLength: 10 } });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /does not resolve/);
});

test('only narrowable keywords are accepted', async () => {
  const { errors } = applyConstraints(await base(), { 'identity.headline': { pattern: '^x' } });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /not a narrowable keyword/);
});

test('constraints reach into array item properties', async () => {
  const { schema, errors } = applyConstraints(await base(), { 'projects.title': { maxLength: 24 } });
  assert.deepEqual(errors, []);
  assert.equal(schema.properties.projects.items.properties.title.maxLength, 24);
});

test('both shipped fixtures satisfy the base schema', async () => {
  for (const name of ['sparse', 'full']) {
    const result = await validateProfile(await readJson(join(ROOT, 'schema', 'fixtures', `${name}.json`)));
    assert.equal(result.ok, true, `${name}.json: ${JSON.stringify(result.findings, null, 2)}`);
  }
});

test('overflowing content is rejected with an actionable message', async () => {
  const profile = await readJson(join(ROOT, 'schema', 'fixtures', 'sparse.json'));
  profile.identity.headline = 'x'.repeat(61);

  const result = await validateProfile(profile);
  assert.equal(result.ok, false);
  const f = result.findings.find((x) => x.where.endsWith('/headline'));
  assert.ok(f, 'expected a finding on identity.headline');
  assert.match(f.message, /61 characters; this slot holds 60/);
  assert.match(f.fix, /Do not widen the bound/);
});

test('unknown fields are rejected so typos cannot silently vanish', async () => {
  const profile = await readJson(join(ROOT, 'schema', 'fixtures', 'sparse.json'));
  profile.identity.nmae = 'typo';

  const result = await validateProfile(profile);
  assert.equal(result.ok, false);
  assert.match(result.findings[0].message, /Unknown field/);
});

test('contact provider must be supported by the chosen template', async () => {
  // Exercised end-to-end in the template CI; here we assert the base schema's
  // own conditional: formspree without an id is invalid.
  const profile = await readJson(join(ROOT, 'schema', 'fixtures', 'sparse.json'));
  profile.contact = { provider: 'formspree' };

  const result = await validateProfile(profile);
  assert.equal(result.ok, false);
});
