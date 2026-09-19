import Section from './Section.jsx';
import { formatRange } from './formatDate.js';

export default function Education({ profile }) {
  const entries = profile.education;
  if (!entries?.length) return null;

  return (
    <Section id="education" title="Education">
      <div className="timeline">
        {entries.map((entry) => (
          <article className="entry" key={entry.institution}>
            <p className="entry__when">{formatRange(entry.start, entry.end)}</p>
            <div className="entry__body">
              <h3 className="entry__role">{entry.institution}</h3>
              {entry.credential && <p className="entry__org">{entry.credential}</p>}
              {entry.note && <p className="entry__summary">{entry.note}</p>}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
