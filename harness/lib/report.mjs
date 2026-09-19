/**
 * Gate results. A gate returns { ok, findings[] }; a finding is what a human
 * needs to act: where it is, what is wrong, and how to fix it.
 */

export const SEVERITY = { ERROR: 'error', WARN: 'warn' };

export function finding({ gate, severity = SEVERITY.ERROR, where, message, fix }) {
  return { gate, severity, where, message, fix };
}

export function pass(gate) {
  return { gate, ok: true, findings: [] };
}

export function fail(gate, findings) {
  const list = Array.isArray(findings) ? findings : [findings];
  return { gate, ok: list.every((f) => f.severity !== SEVERITY.ERROR), findings: list };
}

const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (COLOR ? `\u001b[${code}m${s}\u001b[0m` : s);
export const dim = (s) => c('2', s);
export const red = (s) => c('31', s);
export const green = (s) => c('32', s);
export const yellow = (s) => c('33', s);

export function printReport(results) {
  let errors = 0;
  let warnings = 0;

  for (const r of results) {
    const mark = r.ok ? green('PASS') : red('FAIL');
    console.log(`\n${mark}  ${r.gate}`);
    for (const f of r.findings) {
      const isError = f.severity === SEVERITY.ERROR;
      isError ? errors++ : warnings++;
      const tag = isError ? red('  error') : yellow('   warn');
      console.log(`${tag}  ${f.where}`);
      console.log(`         ${f.message}`);
      if (f.fix) console.log(dim(`         fix: ${f.fix}`));
    }
  }

  console.log(
    `\n${errors === 0 ? green('All gates green.') : red(`${errors} error${errors === 1 ? '' : 's'}`)}` +
      (warnings ? yellow(`  ${warnings} warning${warnings === 1 ? '' : 's'}`) : '')
  );
  return errors === 0;
}
