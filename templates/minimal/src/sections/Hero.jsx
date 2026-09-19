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
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function Hero({ profile }) {
  const { identity, links = {} } = profile;
  const { avatar } = identity;

  // No photo is common and fine. Typographic initials read as deliberate;
  // a broken image placeholder does not.
  const mark = avatar?.src ? (
    <img
      className="avatar"
      src={avatar.src}
      alt={avatar.alt || identity.name}
      width={avatar.width || 72}
      height={avatar.height || 72}
    />
  ) : (
    <div className="avatar avatar--initials" aria-hidden="true">{initials(identity.name)}</div>
  );

  const profileLinks = Object.entries(links).filter(([key]) => key !== 'email' && key in LABELS);

  return (
    <header className="hero container reveal">
      {mark}

      <h1 className="hero__name">{identity.name}</h1>
      <p className="hero__headline">{identity.headline}</p>
      {identity.tagline && <p className="hero__tagline">{identity.tagline}</p>}

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
    </header>
  );
}
