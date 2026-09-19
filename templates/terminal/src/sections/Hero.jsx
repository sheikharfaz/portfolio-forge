const LABELS = {
  github: 'github',
  linkedin: 'linkedin',
  x: 'x',
  website: 'web',
  dribbble: 'dribbble',
  behance: 'behance',
  youtube: 'youtube',
  resume: 'resume',
};

export default function Hero({ profile }) {
  const { identity, links = {} } = profile;
  const profileLinks = Object.entries(links).filter(([key]) => key !== 'email' && key in LABELS);

  return (
    <header className="hero">
      <h1 className="hero__name">{identity.name}</h1>

      <dl className="meta">
        <div className="meta__row">
          <dt>role</dt>
          <dd>{identity.headline}</dd>
        </div>
        {identity.tagline && (
          <div className="meta__row">
            <dt>about</dt>
            <dd>{identity.tagline}</dd>
          </div>
        )}
        {identity.location && (
          <div className="meta__row">
            <dt>location</dt>
            <dd>{identity.location}</dd>
          </div>
        )}
        {identity.pronouns && (
          <div className="meta__row">
            <dt>pronouns</dt>
            <dd>{identity.pronouns}</dd>
          </div>
        )}
        {profileLinks.length > 0 && (
          <div className="meta__row">
            <dt>links</dt>
            <dd>
              <ul className="inline-links">
                {profileLinks.map(([key, href]) => (
                  <li key={key}>
                    <a href={href} target="_blank" rel="noopener noreferrer">{LABELS[key]}</a>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>
    </header>
  );
}
