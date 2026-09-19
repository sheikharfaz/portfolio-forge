import { useReducedMotion } from 'framer-motion';

/**
 * Scroll reveal props for a motion element.
 *
 * Under prefers-reduced-motion this returns nothing at all, so the element
 * renders as plain static content. That is stricter than animating instantly:
 * there is no state in which the content exists but is invisible, which is the
 * failure mode that makes scroll-reveal sites unusable when the animation
 * never fires.
 */
export function useReveal({ delay = 0 } = {}) {
  const still = useReducedMotion();
  if (still) return {};

  return {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: 0.5, delay, ease: [0.2, 0.7, 0.3, 1] },
  };
}
