import Section from './Section.jsx';
import { formatRange } from './formatDate.js';

export default function Education({ profile }) {
  const entries = profile.education;
  if (!entries?.length) return null;

  return (
    <Section id="education" command="cat education.txt">
      <ul className="listing">
        {entries.map((entry) => (
          <li className="listing__item" key={entry.institution}>
            <div className="listing__head">
              <span className="listing__marker" aria-hidden="true">-</span>
              <h3 className="listing__title">{entry.institution}</h3>
              <span className="listing__aside">{formatRange(entry.start, entry.end)}</span>
            </div>
            {entry.credential && <p className="listing__org">{entry.credential}</p>}
            {entry.note && <p className="listing__summary">{entry.note}</p>}
          </li>
        ))}
      </ul>
    </Section>
  );
}
