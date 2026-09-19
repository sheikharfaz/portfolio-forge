import Section from './Section.jsx';
import { formatRange } from './formatDate.js';

export default function Experience({ profile }) {
  const roles = profile.experience;
  if (!roles?.length) return null;

  return (
    <Section id="experience" title="Experience">
      <div className="timeline">
        {roles.map((role) => (
          <article className="entry" key={`${role.company}-${role.start}`}>
            <p className="entry__when">{formatRange(role.start, role.end)}</p>
            <div className="entry__body">
              <h3 className="entry__role">{role.role}</h3>
              <p className="entry__org">
                {role.company}
                {role.location && <span className="entry__where"> · {role.location}</span>}
              </p>
              {role.summary && <p className="entry__summary">{role.summary}</p>}
              {role.highlights?.length > 0 && (
                <ul className="highlights">
                  {role.highlights.map((h) => <li key={h}>{h}</li>)}
                </ul>
              )}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
