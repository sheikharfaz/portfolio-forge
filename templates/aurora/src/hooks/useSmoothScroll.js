import { useEffect } from 'react';

/**
 * Lenis smooth scrolling, loaded only when it will actually be used.
 *
 * Hijacking scroll is a real imposition, so it is off under
 * prefers-reduced-motion and off for anyone driving with a keyboard or a
 * screen reader who relies on native scroll-into-view behaviour. Lenis handles
 * the latter, but the bail-out below means the page is still perfectly usable
 * if the import fails for any reason.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let lenis = null;
    let frame = 0;
    let cancelled = false;

    import('lenis')
      .then(({ default: Lenis }) => {
        if (cancelled) return;
        lenis = new Lenis({ duration: 1.05, smoothWheel: true });
        const raf = (time) => {
          lenis?.raf(time);
          frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);
      })
      .catch(() => {
        // Native scrolling is a perfectly good outcome; it is the default.
      });

    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, []);
}
