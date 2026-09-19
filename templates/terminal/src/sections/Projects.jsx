import Section from './Section.jsx';

export default function Projects({ profile }) {
  const projects = profile.projects;
  if (!projects?.length) return null;

  const ordered = [...projects].sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));

  return (
    <Section id="projects" command="ls -la projects/">
      <ul className="listing">
        {ordered.map((project) => (
          <li className="listing__item" key={project.title}>
            <div className="listing__head">
              <span className="listing__marker" aria-hidden="true">{project.featured ? '*' : '-'}</span>
              <h3 className="listing__title">{project.title}</h3>
              {project.year && <span className="listing__aside">{project.year}</span>}
            </div>

            <p className="listing__summary">{project.summary}</p>

            {project.tech?.length > 0 && (
              <p className="listing__tech">
                <span className="visually-hidden">Built with: </span>
                {project.tech.join(' · ')}
              </p>
            )}

            {project.links && Object.keys(project.links).length > 0 && (
              <ul className="inline-links">
                {project.links.live && (
                  <li>
                    <a href={project.links.live} target="_blank" rel="noopener noreferrer">
                      live<span className="visually-hidden"> — {project.title}</span>
                    </a>
                  </li>
                )}
                {project.links.repo && (
                  <li>
                    <a href={project.links.repo} target="_blank" rel="noopener noreferrer">
                      source<span className="visually-hidden"> — {project.title}</span>
                    </a>
                  </li>
                )}
                {project.links.docs && (
                  <li>
                    <a href={project.links.docs} target="_blank" rel="noopener noreferrer">
                      docs<span className="visually-hidden"> — {project.title}</span>
                    </a>
                  </li>
                )}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
