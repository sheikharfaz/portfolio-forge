import Prompt from './Prompt.jsx';

export default function Section({ id, command, children }) {
  return (
    <section className="section" aria-labelledby={`${id}-title`}>
      <Prompt id={`${id}-title`} command={command} />
      <div className="section__output">{children}</div>
    </section>
  );
}
