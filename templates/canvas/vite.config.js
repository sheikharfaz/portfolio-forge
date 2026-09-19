import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * A GitHub Pages project site is served from /<repo>/, not /. A build made for
 * / renders as an unstyled blank page, which is the single most common way
 * these deploys fail — so the base path is injected at build time from the repo
 * name rather than hardcoded.
 *
 * A user site (<login>.github.io) is served from / and must have no base path,
 * which is what the empty default gives.
 */
const base = process.env.FORGE_BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      // Pages serves 404.html for any unmatched path. Making it a copy of
      // index.html is what keeps a client-side route alive across a refresh.
      name: 'forge-spa-fallback',
      closeBundle() {
        const out = resolve(import.meta.dirname, 'dist');
        copyFileSync(resolve(out, 'index.html'), resolve(out, '404.html'));
      },
    },
  ],
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
});
