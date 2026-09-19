/**
 * The shell-prompt heading that gives this template its shape.
 *
 * The `$` and the command are decoration, so they are aria-hidden and the
 * heading carries a plain accessible name instead. A screen reader announcing
 * "dollar cat about dot md" is worse than useless.
 */
export default function Prompt({ id, command, as: Tag = 'h2' }) {
  return (
    <Tag className="prompt" id={id}>
      <span className="prompt__sigil" aria-hidden="true">$</span>
      <span className="prompt__command" aria-hidden="true">{command}</span>
      <span className="visually-hidden">{command}</span>
    </Tag>
  );
}
