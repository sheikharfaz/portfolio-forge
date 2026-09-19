import Hero from './sections/Hero.jsx';
import About from './sections/About.jsx';
import Skills from './sections/Skills.jsx';
import Chronology from './sections/Chronology.jsx';
import Undated from './sections/Undated.jsx';
import Contact from './sections/Contact.jsx';
import Footer from './sections/Footer.jsx';

/**
 * This template collapses experience, education and dated projects into one
 * chronology, so `site.sections` cannot drive it the way the others allow.
 * Undated projects get their own section rather than being dropped.
 */
export default function App({ profile }) {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Hero profile={profile} />
      <main id="main">
        <About profile={profile} />
        <Chronology profile={profile} />
        <Undated profile={profile} />
        <Skills profile={profile} />
        <Contact profile={profile} />
      </main>
      <Footer profile={profile} />
    </>
  );
}
