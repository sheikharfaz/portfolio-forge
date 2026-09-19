/**
 * Applies a template's `constraints` overlay onto the base profile schema.
 *
 * A template may only ever NARROW the base schema. Widening would let a
 * template accept content the base schema considers unsafe, which defeats the
 * point of having a base schema at all, so it is rejected loudly.
 */

const NARROWING = {
  // key            -> true when `next` is stricter than or equal to `base`
  maxLength: (base, next) => next <= base,
  maxItems: (base, next) => next <= base,
  minLength: (base, next) => next >= base,
  minItems: (base, next) => next >= base,
  maximum: (base, next) => next <= base,
  minimum: (base, next) => next >= base,
};

/** Resolve a dotted path like `identity.headline` or `projects` to its subschema. */
function resolve(schema, path) {
  let node = schema;
  for (const part of path.split('.')) {
    if (node?.type === 'array' && node.items) node = node.items;
    node = node?.properties?.[part];
    if (!node) return null;
  }
  return node;
}

/**
 * @returns {{ schema: object, errors: string[] }}
 */
export function applyConstraints(baseSchema, constraints = {}) {
  const schema = structuredClone(baseSchema);
  const errors = [];

  for (const [path, overrides] of Object.entries(constraints)) {
    const target = resolve(schema, path);
    if (!target) {
      errors.push(`constraints["${path}"] does not resolve to anything in the base schema`);
      continue;
    }

    for (const [key, value] of Object.entries(overrides)) {
      const check = NARROWING[key];
      if (!check) {
        errors.push(`constraints["${path}"].${key} is not a narrowable keyword (allowed: ${Object.keys(NARROWING).join(', ')})`);
        continue;
      }
      const baseValue = target[key];
      if (baseValue !== undefined && !check(baseValue, value)) {
        errors.push(
          `constraints["${path}"].${key} = ${value} widens the base schema (${baseValue}). ` +
            `Templates may only narrow. If the slot genuinely fits more, change the base schema deliberately.`
        );
        continue;
      }
      target[key] = value;
    }
  }

  return { schema, errors };
}
