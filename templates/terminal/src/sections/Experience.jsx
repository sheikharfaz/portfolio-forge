import Section from './Section.jsx';
import { formatRange } from './formatDate.js';

export default function Experience({ profile }) {
  const roles = profile.experience;
  if (!roles?.length) return null;

  return (
    <Section id="experience" command="git log --author=me">
      <ul className="listing">
        {roles.map((role) => (
          <li className="listing__item" key={`${role.company}-${role.start}`}>
            <div className="listing__head">
              <span className="listing__marker" aria-hidden="true">-</span>
              <h3 className="listing__title">{role.role}</h3>
              <span className="listing__aside">{formatRange(role.start, role.end)}</span>
            </div>

            <p className="listing__org">
              {role.company}
              {role.location && <span className="listing__where"> · {role.location}</span>}
            </p>

            {role.summary && <p className="listing__summary">{role.summary}</p>}

            {role.highlights?.length > 0 && (
              <ul className="highlights">
                {role.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
