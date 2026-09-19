export default function Footer({ profile }) {
  return (
    <footer className="footer container">
      <span>
        © {new Date().getFullYear()} {profile.identity.name}
      </span>
      <span>
        Built with{' '}
        <a href="https://github.com/sheikharfaz/portfolio-forge" target="_blank" rel="noopener noreferrer">
          Portfolio Forge
        </a>
      </span>
    </footer>
  );
}
