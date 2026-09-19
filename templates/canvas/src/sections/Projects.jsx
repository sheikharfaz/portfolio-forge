export default function Projects({ profile }) {
  const projects = profile.projects;
  if (!projects?.length) return null;

  const ordered = [...projects].sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));

  return (
    <section className="section container" aria-labelledby="projects-title">
      <h2 className="section__title" id="projects-title">Work</h2>

      <div className="gallery">
        {ordered.map((project) => (
          <article className={`shot${project.featured ? ' shot--wide' : ''}`} key={project.title}>
            {project.media?.src ? (
              <img
                className="shot__image"
                src={project.media.src}
                alt={project.media.alt || ''}
                loading="lazy"
                width={project.media.width || undefined}
                height={project.media.height || undefined}
              />
            ) : (
              /*
               * No screenshot is normal — plenty of good work has none. A
               * typographic panel reads as deliberate; a grey placeholder box
               * reads as something that failed to load.
               */
              <div className="shot__placeholder" aria-hidden="true">
                <span>{project.title.slice(0, 2).toUpperCase()}</span>
              </div>
            )}

            <div className="shot__body">
              <div className="shot__head">
                <h3 className="shot__title">{project.title}</h3>
                {project.year && <span className="shot__year">{project.year}</span>}
              </div>

              <p className="shot__summary">{project.summary}</p>

              {project.tech?.length > 0 && (
                <ul className="tags">
                  {project.tech.map((t) => <li className="tag" key={t}>{t}</li>)}
                </ul>
              )}

              {project.links && Object.keys(project.links).length > 0 && (
                <div className="shot__links">
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
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
