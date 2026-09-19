export default function Footer({ profile }) {
  return (
    <footer className="footer">
      <p>
        <span className="prompt__sigil" aria-hidden="true">$</span>{' '}
        <span aria-hidden="true">exit</span>
        <span className="visually-hidden">End of page.</span>
      </p>
      <p className="footer__meta">
        © {new Date().getFullYear()} {profile.identity.name} · built with{' '}
        <a href="https://github.com/sheikharfaz/portfolio-forge" target="_blank" rel="noopener noreferrer">
          Portfolio Forge
        </a>
      </p>
    </footer>
  );
}
