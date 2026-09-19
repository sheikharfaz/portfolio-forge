import { formatRange, formatMonth } from './formatDate.js';

/**
 * One spine for a career: roles, study and dated projects interleaved.
 *
 * Merging them is the point of this template — a reader sees that the side
 * project and the promotion happened the same year, which separate sections
 * hide. Anything undated is left out rather than guessed at; a fabricated
 * date on someone's professional record is not a rounding error.
 */
function toEntries(profile) {
  const entries = [];

  for (const role of profile.experience ?? []) {
    entries.push({
      kind: 'role',
      key: `role-${role.company}-${role.start}`,
      start: role.start,
      when: formatRange(role.start, role.end),
      title: role.role,
      org: role.company,
      where: role.location,
      summary: role.summary,
      highlights: role.highlights,
    });
  }

  for (const study of profile.education ?? []) {
    if (!study.start) continue;
    entries.push({
      kind: 'study',
      key: `study-${study.institution}`,
      start: study.start,
      when: formatRange(study.start, study.end),
      title: study.institution,
      org: study.credential,
      summary: study.note,
    });
  }

  for (const project of profile.projects ?? []) {
    if (!project.year) continue;
    entries.push({
      kind: 'project',
      key: `project-${project.title}`,
      // A year alone sorts against year-months as if it were January.
      start: `${project.year}-01`,
      when: formatMonth(`${project.year}-01`).split(' ')[1],
      title: project.title,
      org: project.tech?.join(' · '),
      summary: project.summary,
      links: project.links,
    });
  }

  // Most recent first. An ongoing role sorts above a finished one that started
  // the same month, which is what a reader expects to see at the top.
  return entries.sort((a, b) => b.start.localeCompare(a.start));
}

const LABEL = { role: 'Role', study: 'Study', project: 'Project' };

export default function Chronology({ profile }) {
  const entries = toEntries(profile);
  if (!entries.length) return null;

  return (
    <section className="section container" aria-labelledby="chronology-title">
      <h2 className="section__title" id="chronology-title">Chronology</h2>

      <ol className="spine">
        {entries.map((entry) => (
          <li className={`beat beat--${entry.kind}`} key={entry.key}>
            <div className="beat__when">
              <span className="beat__date">{entry.when}</span>
              <span className="beat__kind">{LABEL[entry.kind]}</span>
            </div>

            <div className="beat__body">
              <h3 className="beat__title">{entry.title}</h3>
              {entry.org && (
                <p className="beat__org">
                  {entry.org}
                  {entry.where && <span className="beat__where"> · {entry.where}</span>}
                </p>
              )}
              {entry.summary && <p className="beat__summary">{entry.summary}</p>}

              {entry.highlights?.length > 0 && (
                <ul className="highlights">
                  {entry.highlights.map((h) => <li key={h}>{h}</li>)}
                </ul>
              )}

              {entry.links && Object.keys(entry.links).length > 0 && (
                <div className="beat__links">
                  {entry.links.live && (
                    <a href={entry.links.live} target="_blank" rel="noopener noreferrer">
                      Live<span className="visually-hidden"> — {entry.title}</span>
                    </a>
                  )}
                  {entry.links.repo && (
                    <a href={entry.links.repo} target="_blank" rel="noopener noreferrer">
                      Code<span className="visually-hidden"> — {entry.title}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
