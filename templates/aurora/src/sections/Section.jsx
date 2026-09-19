import { motion } from 'framer-motion';

import { useReveal } from '../hooks/useReveal.js';

/**
 * The shared shell for every section: a reveal on entry, a landmark, and a
 * heading that is always associated with its region.
 */
export default function Section({ id, title, children }) {
  const reveal = useReveal();

  return (
    <motion.section className="section" aria-labelledby={`${id}-title`} {...reveal}>
      <div className="container">
        <h2 className="section__title" id={`${id}-title`}>
          <span className="section__rule" aria-hidden="true" />
          {title}
        </h2>
        {children}
      </div>
    </motion.section>
  );
}
