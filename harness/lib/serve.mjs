/**
 * A static server for the built output, with the SPA fallback a deep-linked
 * portfolio needs. Deliberately dependency-free: the harness must not drag a
 * server framework into every template's install.
 */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

async function resolveFile(root, urlPath) {
  // Strip traversal before it reaches the filesystem.
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const candidates = [join(root, clean)];
  if (!extname(clean)) candidates.push(join(root, clean, 'index.html'));

  for (const c of candidates) {
    if (!c.startsWith(root)) continue;
    try {
      const s = await stat(c);
      if (s.isFile()) return c;
    } catch { /* try the next candidate */ }
  }
  return null;
}

/** @returns {Promise<{ url: string, close: () => Promise<void> }>} */
export async function serveStatic(root, { spaFallback = true } = {}) {
  const server = createServer(async (req, res) => {
    let file = await resolveFile(root, req.url || '/');

    // The fallback that makes /project/:id work, mirroring GitHub Pages' 404.html.
    if (!file && spaFallback && !extname(req.url.split('?')[0])) {
      file = await resolveFile(root, '/index.html');
    }

    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
      return;
    }

    res.writeHead(200, {
      'content-type': TYPES[extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    createReadStream(file).pipe(res);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
