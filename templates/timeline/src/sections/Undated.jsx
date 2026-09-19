/**
 * Projects with no year. They cannot go on the spine without inventing a date,
 * and dropping them silently would lose real work, so they get their own
 * section below it.
 */
export default function Undated({ profile }) {
  const projects = (profile.projects ?? []).filter((p) => !p.year);
  if (!projects.length) return null;

  return (
    <section className="section container" aria-labelledby="undated-title">
      <h2 className="section__title" id="undated-title">Also</h2>
      <div className="projects">
        {projects.map((project) => (
          <article className="project" key={project.title}>
            <h3 className="project__title">{project.title}</h3>
            <p className="project__summary">{project.summary}</p>
            {project.tech?.length > 0 && (
              <ul className="tags">
                {project.tech.map((t) => <li className="tag" key={t}>{t}</li>)}
              </ul>
            )}
            {project.links?.repo && (
              <div className="project__links">
                <a href={project.links.repo} target="_blank" rel="noopener noreferrer">
                  Code<span className="visually-hidden"> — {project.title}</span>
                </a>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
