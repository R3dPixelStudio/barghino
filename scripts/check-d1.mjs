import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { Repository } from '../server/repository.ts';
import { d1Driver } from '../server/d1.ts';
const mf = new Miniflare(
  convertV4MiniflareOptions({
    modules: true,
    scriptPath: resolve('.worker-build/index.js'),
    compatibilityDate: '2026-09-01',
    d1Databases: { DB: 'runtime-check' },
  }),
);
try {
  const db = await mf.getD1Database('DB');
  for (const name of ['0001_content', '0002_experience', '0003_d1_media'])
    await db.exec((await readFile(`migrations/${name}.sql`, 'utf8')).replaceAll('\n', ' '));
  const store = new Repository(d1Driver(db));
  const meta = {
    key: `${crypto.randomUUID()}.mp4`,
    name: 'runtime.mp4',
    type: 'video/mp4',
    size: 262144 + 12,
    createdAt: new Date().toISOString(),
  };
  await store.beginMedia(meta);
  const chunk = new Uint8Array(262144);
  chunk.set(new TextEncoder().encode('ftypisom'), 4);
  assert.equal(await store.appendMedia(meta.key, 0, chunk.buffer), true);
  assert.equal(await store.appendMedia(meta.key, 1, new Uint8Array(12).buffer), true);
  assert.deepEqual(await store.finishMedia(meta.key), meta);
  const first = await mf.dispatchFetch(`https://example.test/media/${meta.key}`);
  assert.equal(first.status, 200);
  assert.equal((await first.arrayBuffer()).byteLength, meta.size);
  const partial = await mf.dispatchFetch(`https://example.test/media/${meta.key}`, {
    headers: { Range: 'bytes=262140-262149' },
  });
  assert.equal(partial.status, 206);
  assert.equal((await partial.arrayBuffer()).byteLength, 10);
  const head = await mf.dispatchFetch(`https://example.test/media/${meta.key}`, { method: 'HEAD' });
  assert.equal(head.headers.get('content-length'), String(meta.size));
  assert.equal((await mf.dispatchFetch('https://example.test/admin/')).status, 401);
  const post = {
    id: crypto.randomUUID(),
    locale: 'en',
    title: 'D1 check',
    slug: 'd1-check',
    category: '',
    excerpt: 'Runtime check',
    body: 'A checked upload.',
    cover: `/media/${meta.key}`,
    coverAlt: 'Check',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    revision: crypto.randomUUID(),
  };
  assert.equal(await store.savePost(post, null), true);
  assert.equal(await store.deleteMedia(meta.key), false);
  assert.equal(await store.deletePost(post.id, post.revision), true);
  assert.equal(await store.deleteMedia(meta.key), true);
  assert.equal((await store.mediaUsage()).used, 0);
  console.log(
    'D1 runtime: staged binary upload, atomic publication, streamed GET/range, HEAD, protected admin, transactional references and cascade deletion passed.',
  );
} finally {
  await mf.dispose();
}
