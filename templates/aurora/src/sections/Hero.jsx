import { motion } from 'framer-motion';

import { useReveal } from '../hooks/useReveal.js';

const LABELS = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  x: 'X',
  website: 'Website',
  dribbble: 'Dribbble',
  behance: 'Behance',
  youtube: 'YouTube',
  resume: 'Résumé',
};

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

export default function Hero({ profile }) {
  const { identity, links = {} } = profile;
  const { avatar } = identity;

  const name = useReveal();
  const headline = useReveal({ delay: 0.08 });
  const tagline = useReveal({ delay: 0.16 });
  const nav = useReveal({ delay: 0.24 });

  const mark = avatar?.src ? (
    <img
      className="avatar"
      src={avatar.src}
      alt={avatar.alt || identity.name}
      width={avatar.width || 76}
      height={avatar.height || 76}
    />
  ) : (
    <div className="avatar avatar--initials" aria-hidden="true">{initials(identity.name)}</div>
  );

  const profileLinks = Object.entries(links).filter(([key]) => key !== 'email' && key in LABELS);

  return (
    <header className="hero">
      <div className="container">
        <motion.div {...name}>
          {mark}
          <h1 className="hero__name">{identity.name}</h1>
        </motion.div>

        <motion.p className="hero__headline" {...headline}>{identity.headline}</motion.p>

        {identity.tagline && (
          <motion.p className="hero__tagline" {...tagline}>{identity.tagline}</motion.p>
        )}

        <motion.div {...nav}>
          {(identity.location || identity.pronouns) && (
            <p className="hero__meta">
              {identity.location && <span>{identity.location}</span>}
              {identity.pronouns && <span>{identity.pronouns}</span>}
            </p>
          )}

          {profileLinks.length > 0 && (
            <nav className="hero__links" aria-label="Profiles">
              {profileLinks.map(([key, href]) => (
                <a className="link-pill" key={key} href={href} target="_blank" rel="noopener noreferrer">
                  {LABELS[key]}
                </a>
              ))}
            </nav>
          )}
        </motion.div>
      </div>
    </header>
  );
}
