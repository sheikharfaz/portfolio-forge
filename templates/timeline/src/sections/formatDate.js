const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2021-03" -> "Mar 2021"; "present" -> "Present". */
export function formatMonth(value) {
  if (!value) return '';
  if (value === 'present') return 'Present';
  const [year, month] = value.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

export function formatRange(start, end) {
  const from = formatMonth(start);
  const to = formatMonth(end);
  if (from && to) return `${from} — ${to}`;
  return from || to;
}
