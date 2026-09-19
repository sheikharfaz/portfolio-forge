export default function Projects({ profile }) {
  const projects = profile.projects;
  if (!projects?.length) return null;

  // Featured work leads; the rest keeps its authored order.
  const ordered = [...projects].sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));

  return (
    <section className="section container" id="projects" aria-labelledby="projects-title">
      <h2 className="section__title" id="projects-title">Projects</h2>
      <div className="projects">
        {ordered.map((project) => (
          <article className="project" key={project.title}>
            <div className="project__head">
              <h3 className="project__title">{project.title}</h3>
              {project.year && <span className="project__year">{project.year}</span>}
            </div>

            <p className="project__summary">{project.summary}</p>

            {project.tech?.length > 0 && (
              <ul className="tags">
                {project.tech.map((t) => (
                  <li className="tag" key={t}>{t}</li>
                ))}
              </ul>
            )}

            {project.links && Object.keys(project.links).length > 0 && (
              <div className="project__links">
                {project.links.live && (
                  <a href={project.links.live} target="_blank" rel="noopener noreferrer">
                    Live<span className="visually-hidden"> — {project.title}</span>
                  </a>
                )}
                {project.links.repo && (
                  <a href={project.links.repo} target="_blank" rel="noopener noreferrer">
                    Code<span className="visually-hidden"> — {project.title}</span>
                  </a>
                )}
                {project.links.docs && (
                  <a href={project.links.docs} target="_blank" rel="noopener noreferrer">
                    Docs<span className="visually-hidden"> — {project.title}</span>
                  </a>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
