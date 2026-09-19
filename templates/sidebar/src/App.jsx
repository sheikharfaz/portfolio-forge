import Hero from './sections/Hero.jsx';
import About from './sections/About.jsx';
import Skills from './sections/Skills.jsx';
import Projects from './sections/Projects.jsx';
import Experience from './sections/Experience.jsx';
import Education from './sections/Education.jsx';
import Contact from './sections/Contact.jsx';
import Footer from './sections/Footer.jsx';

const SECTIONS = {
  about: { Component: About, label: 'About' },
  skills: { Component: Skills, label: 'Skills' },
  projects: { Component: Projects, label: 'Projects' },
  experience: { Component: Experience, label: 'Experience' },
  education: { Component: Education, label: 'Education' },
  contact: { Component: Contact, label: 'Contact' },
};

const DEFAULT_ORDER = ['about', 'experience', 'projects', 'skills', 'education', 'contact'];

/** Sections with nothing behind them are dropped, so the nav never links to an
 *  empty region. */
function hasContent(key, profile) {
  switch (key) {
    case 'about': return Boolean(profile.bio?.long);
    case 'skills': return Boolean(profile.skills?.length);
    case 'projects': return Boolean(profile.projects?.length);
    case 'experience': return Boolean(profile.experience?.length);
    case 'education': return Boolean(profile.education?.length);
    case 'contact': return profile.contact?.provider !== 'none' || Boolean(profile.links?.email);
    default: return false;
  }
}

export default function App({ profile }) {
  const order = (profile.site?.sections?.length ? profile.site.sections : DEFAULT_ORDER)
    .filter((key) => key in SECTIONS && hasContent(key, profile));

  return (
    <div className="layout">
      <a className="skip-link" href="#main">Skip to content</a>

      <div className="rail">
        <Hero profile={profile} />
        {order.length > 0 && (
          <nav className="rail__nav" aria-label="Sections">
            <ul>
              {order.map((key) => (
                <li key={key}>
                  <a href={`#${key}`}>{SECTIONS[key].label}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <div className="content">
        <main id="main">
          {order.map((key) => {
            const { Component } = SECTIONS[key];
            return <Component key={key} profile={profile} />;
          })}
        </main>
        <Footer profile={profile} />
      </div>
    </div>
  );
}
