import { useEffect, useRef, useState } from 'react';

import { createAurora, hexToRgb } from './shader.js';

// Film grain, inline so the page never reaches a third-party origin for a
// decorative texture.
const GRAIN =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/**
 * The live backdrop, and the three conditions under which it is not live:
 *
 *   - below 1024px, where a permanent render loop is a poor trade for a
 *     decorative background on a battery;
 *   - under prefers-reduced-motion;
 *   - anywhere WebGL2 is unavailable or refuses a performant context.
 *
 * In all three the CSS bloom below stands in. Under the vignette and grain the
 * two read almost identically, which is the point — the fallback is not a
 * degraded experience, it is the same picture without the render loop.
 */
export default function Backdrop({ accent }) {
  const canvasRef = useRef(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const wide = window.matchMedia('(min-width: 1024px)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');

    let aurora = null;
    let frame = 0;
    let observer = null;
    let visible = true;
    let start = 0;

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      observer?.disconnect();
      observer = null;
      aurora?.dispose();
      aurora = null;
      setLive(false);
    };

    const start_ = () => {
      if (aurora || !wide.matches || still.matches) return;

      aurora = createAurora(canvas, hexToRgb(accent));
      if (!aurora) return; // no WebGL2 — the CSS bloom is already behind us

      // Device pixel ratio is capped: a full-screen fragment shader at 3x on a
      // high-DPI display is four times the work for no visible gain behind a
      // vignette.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const resize = () => aurora?.resize(
        Math.floor(window.innerWidth * dpr),
        Math.floor(window.innerHeight * dpr)
      );
      resize();
      window.addEventListener('resize', resize, { passive: true });

      // Nothing renders while the tab is hidden or the canvas is scrolled past.
      observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
      observer.observe(canvas);

      start = performance.now();
      const loop = (now) => {
        if (!aurora) return;
        if (visible && document.visibilityState === 'visible') {
          aurora.render((now - start) / 1000);
        }
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
      setLive(true);

      return () => window.removeEventListener('resize', resize);
    };

    start_();

    const reconsider = () => { stop(); start_(); };
    wide.addEventListener('change', reconsider);
    still.addEventListener('change', reconsider);

    return () => {
      wide.removeEventListener('change', reconsider);
      still.removeEventListener('change', reconsider);
      stop();
    };
  }, [accent]);

  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__bloom" />
      <canvas ref={canvasRef} className="backdrop__canvas" data-live={live || undefined} />
      <div className="backdrop__grain" style={{ backgroundImage: `url("${GRAIN}")` }} />
      <div className="backdrop__vignette" />
    </div>
  );
}
