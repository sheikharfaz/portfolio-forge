import Backdrop from './backdrop/Backdrop.jsx';
import { useSmoothScroll } from './hooks/useSmoothScroll.js';

import Hero from './sections/Hero.jsx';
import About from './sections/About.jsx';
import Skills from './sections/Skills.jsx';
import Projects from './sections/Projects.jsx';
import Experience from './sections/Experience.jsx';
import Education from './sections/Education.jsx';
import Contact from './sections/Contact.jsx';
import Footer from './sections/Footer.jsx';

const SECTIONS = {
  about: About,
  skills: Skills,
  projects: Projects,
  experience: Experience,
  education: Education,
  contact: Contact,
};

const DEFAULT_ORDER = ['about', 'projects', 'experience', 'skills', 'education', 'contact'];

export default function App({ profile, accent }) {
  useSmoothScroll();

  const order = profile.site?.sections?.length ? profile.site.sections : DEFAULT_ORDER;

  return (
    <>
      <Backdrop accent={accent} />
      <a className="skip-link" href="#main">Skip to content</a>
      <Hero profile={profile} />
      <main id="main">
        {order
          .filter((key) => key in SECTIONS)
          .map((key) => {
            const Section = SECTIONS[key];
            return <Section key={key} profile={profile} />;
          })}
      </main>
      <Footer profile={profile} />
    </>
  );
}
