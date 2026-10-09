import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { handleContent } from '../server/handler.ts';
import { localRepository } from '../server/local.ts';

const root = resolve('out');
const port = Number(process.env.PORT ?? 3100);
const origin = `http://127.0.0.1:${port}`;
const { repository, close } = await localRepository(resolve(process.env.CONTENT_DIR ?? '.data'));
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
};
const server = createServer(async (incoming, outgoing) => {
  try {
    if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(incoming.headers.host)) {
      outgoing.writeHead(403).end('Invalid host');
      return;
    }
    const url = new URL(incoming.url, `http://${incoming.headers.host}`);
    const init = { method: incoming.method, headers: incoming.headers };
    if (!['GET', 'HEAD'].includes(incoming.method)) {
      init.body = Readable.toWeb(incoming);
      init.duplex = 'half';
    }
    const request = new Request(url, init);
    const result = await handleContent(request, {
      store: repository,
      authenticate: async () => ({ email: 'Local editor', local: true }),
      fingerprint: async () => 'local-preview',
      siteOrigin: process.env.SITE_ORIGIN || undefined,
      ai: { key: process.env.GROQ_API_KEY },
    });
    if (result) {
      outgoing.writeHead(result.status, Object.fromEntries(result.headers));
      if (result.body && incoming.method !== 'HEAD') Readable.fromWeb(result.body).pipe(outgoing);
      else outgoing.end();
      return;
    }
    if (!['GET', 'HEAD'].includes(incoming.method)) {
      outgoing.writeHead(405).end();
      return;
    }
    const pathname = decodeURIComponent(url.pathname);
    let file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + sep)) {
      outgoing.writeHead(403).end();
      return;
    }
    const info = await stat(file);
    if (info.isDirectory()) file = resolve(file, 'index.html');
    const body = await readFile(file);
    outgoing.writeHead(200, {
      'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    outgoing.end(incoming.method === 'HEAD' ? undefined : body);
  } catch (error) {
    if (error.code !== 'ENOENT') process.stderr.write(`Preview: ${error.message}\n`);
    const body = await readFile(resolve(root, '404.html')).catch(() => Buffer.from('Not found'));
    if (!outgoing.headersSent)
      outgoing.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }).end(body);
    else outgoing.end();
  }
});
server.listen(port, '127.0.0.1', () =>
  process.stdout.write(
    `Barghino preview: ${origin}/fa/\nLocal admin: ${origin}/admin/ (loopback only; local development access)\n`,
  ),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      close();
      process.exit(0);
    }),
  );
