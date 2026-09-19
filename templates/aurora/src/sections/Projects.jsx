import { motion } from 'framer-motion';

import Section from './Section.jsx';
import { useReveal } from '../hooks/useReveal.js';

function Project({ project, index }) {
  // Stagger is capped: past a handful of cards a per-index delay means the
  // last one arrives long after the reader got there.
  const reveal = useReveal({ delay: Math.min(index, 3) * 0.06 });

  return (
    <motion.article className="project" {...reveal}>
      {project.media?.src && (
        <img
          className="project__media"
          src={project.media.src}
          alt={project.media.alt || ''}
          loading="lazy"
          width={project.media.width || undefined}
          height={project.media.height || undefined}
        />
      )}

      <div className="project__body">
        <div className="project__head">
          <h3 className="project__title">{project.title}</h3>
          {project.year && <span className="project__year">{project.year}</span>}
        </div>

        <p className="project__summary">{project.summary}</p>

        {project.tech?.length > 0 && (
          <ul className="tags">
            {project.tech.map((t) => <li className="tag" key={t}>{t}</li>)}
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
      </div>
    </motion.article>
  );
}

export default function Projects({ profile }) {
  const projects = profile.projects;
  if (!projects?.length) return null;

  const ordered = [...projects].sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));

  return (
    <Section id="projects" title="Selected work">
      <div className="projects">
        {ordered.map((project, i) => (
          <Project key={project.title} project={project} index={i} />
        ))}
      </div>
    </Section>
  );
}
