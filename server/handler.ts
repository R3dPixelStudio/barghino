import type { Services } from './types.ts';
import { articleHtml, journalHtml, sitemapXml } from './html.ts';
import {
  detectMedia,
  HttpError,
  validateAssistantSettings,
  validateInquiry,
  validatePost,
  validateWork,
} from './validation.ts';
import { chat, defaultAssistant } from './assistant.ts';
import { mediaLimits } from '../src/shared/config/media.ts';

const maxUpload = 20 * 1024 * 1024;
const headers = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store',
};
const json = (data: unknown, status = 200) => Response.json(data, { status, headers });

async function readLimited(request: Request, limit: number) {
  if (Number(request.headers.get('content-length')) > limit)
    throw new HttpError(413, 'File or request is too large');
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new HttpError(413, 'File or request is too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

async function readJson(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new HttpError(415, 'JSON is required');
  try {
    const value = JSON.parse(new TextDecoder().decode(await readLimited(request, 256 * 1024)));
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new HttpError(400, 'A JSON object is required');
    return value;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'Invalid JSON');
  }
}

function sameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    throw new HttpError(403, 'Cross-origin write rejected');
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none')
    throw new HttpError(403, 'Cross-origin request rejected');
}

export async function handleContent(
  request: Request,
  services: Services,
): Promise<Response | null> {
  try {
    const url = new URL(request.url);
    const path = decodeURIComponent(url.pathname).replace(/\/$/, '');
    const { store } = services;
    const admin = path.startsWith('/api/admin/');
    if (admin) {
      const user = await services.authenticate(request);
      if (!user) throw new HttpError(401, 'Sign in with Cloudflare Access to manage content.');
      if (request.method !== 'GET' && request.method !== 'HEAD') sameOrigin(request);
      if (path === '/api/admin/session' && request.method === 'GET') return json(user);
      if (path === '/api/admin/portfolio' && request.method === 'GET')
        return json(await store.portfolio());
      if (path === '/api/admin/portfolio' && request.method === 'POST') {
        const data = await readJson(request);
        const existing = data.id
          ? (await store.portfolio()).find((item) => item.id === data.id)
          : undefined;
        if (data.id && !existing) throw new HttpError(404, 'Gallery item no longer exists');
        if (existing && existing.revision !== data.revision)
          throw new HttpError(409, 'This item changed. Reload before saving.');
        const item = validateWork(data, existing);
        for (const path of [item.src, item.poster, item.captions].filter(
          (path): path is string => !!path,
        ))
          if (!(await store.mediaInfo(path.slice(7))))
            throw new HttpError(400, 'Uploaded media is missing');
        if (!(await store.saveWork(item, existing?.revision ?? null)))
          throw new HttpError(409, 'The item changed while saving. Reload and retry.');
        return json(item, existing ? 200 : 201);
      }
      const workId = path.match(/^\/api\/admin\/portfolio\/([a-f0-9-]{36})$/)?.[1];
      if (workId && request.method === 'DELETE') {
        const data = await readJson(request);
        if (typeof data.revision !== 'string' || !(await store.deleteWork(workId, data.revision)))
          throw new HttpError(409, 'The item changed. Reload before deleting.');
        return json({ deleted: true });
      }
      if (path === '/api/admin/assistant' && request.method === 'GET')
        return json({
          settings: (await store.assistantSettings()) ?? defaultAssistant,
          configured: !!services.ai?.key,
        });
      if (path === '/api/admin/assistant' && request.method === 'POST') {
        const data = await readJson(request);
        const existing = await store.assistantSettings();
        if (existing && data.revision !== existing.revision)
          throw new HttpError(409, 'Settings changed. Reload before saving.');
        const settings = validateAssistantSettings(data);
        if (!(await store.saveAssistantSettings(settings, existing?.revision ?? null)))
          throw new HttpError(409, 'Settings changed while saving. Reload and retry.');
        return json(settings);
      }
      if (path === '/api/admin/posts' && request.method === 'GET') return json(await store.posts());
      if (path === '/api/admin/posts' && request.method === 'POST') {
        const data = await readJson(request);
        const posts = await store.posts();
        const existing = data.id ? posts.find((post) => post.id === data.id) : undefined;
        if (data.id && !existing) throw new HttpError(404, 'Post no longer exists');
        if (existing && existing.revision !== data.revision)
          throw new HttpError(409, 'This post changed in another window. Reload before saving.');
        const post = validatePost(data, existing);
        if (
          posts.some(
            (item) => item.id !== post.id && item.slug === post.slug && item.locale === post.locale,
          )
        )
          throw new HttpError(409, 'This article URL is already in use');
        if (post.cover && !(await store.mediaInfo(post.cover.slice(7))))
          throw new HttpError(400, 'Cover image is missing');
        if (!(await store.savePost(post, existing?.revision ?? null)))
          throw new HttpError(409, 'The post changed while saving. Reload and retry.');
        return json(post, existing ? 200 : 201);
      }
      const postId = path.match(/^\/api\/admin\/posts\/([a-f0-9-]{36})$/)?.[1];
      if (postId && request.method === 'DELETE') {
        const data = await readJson(request);
        if (typeof data.revision !== 'string' || !(await store.deletePost(postId, data.revision)))
          throw new HttpError(409, 'The post changed. Reload before deleting.');
        return json({ deleted: true });
      }
      if (path === '/api/admin/media' && request.method === 'GET') return json(await store.media());
      if (path === '/api/admin/media/usage' && request.method === 'GET')
        return json(await store.mediaUsage());
      if (path === '/api/admin/media/uploads' && request.method === 'POST') {
        const data = await readJson(request);
        const formats: Record<string, string> = {
          'image/png': 'png',
          'image/jpeg': 'jpg',
          'image/webp': 'webp',
          'video/mp4': 'mp4',
          'video/webm': 'webm',
          'text/vtt': 'vtt',
        };
        const extension = typeof data.type === 'string' ? formats[data.type] : undefined;
        if (
          !extension ||
          typeof data.name !== 'string' ||
          !data.name.trim() ||
          data.name.length > 180 ||
          typeof data.size !== 'number' ||
          !Number.isSafeInteger(data.size) ||
          data.size <= 0 ||
          data.size > maxUpload
        )
          throw new HttpError(400, 'Choose a supported image, video or caption file up to 20 MiB');
        if (String(data.type).startsWith('image/') && data.size > mediaLimits.image)
          throw new HttpError(413, 'Images must be 8 MiB or smaller');
        if (extension === 'vtt' && data.size > 512 * 1024)
          throw new HttpError(413, 'Captions must be 512 KiB or smaller');
        const meta = {
          key: `${crypto.randomUUID()}.${extension}`,
          name: data.name,
          type: extension === 'vtt' ? 'text/vtt; charset=utf-8' : String(data.type),
          size: data.size,
          createdAt: new Date().toISOString(),
        };
        await store.beginMedia(meta);
        return json(meta, 201);
      }
      const upload = path.match(
        /^\/api\/admin\/media\/uploads\/([a-f0-9-]{36}\.(?:png|jpg|webp|mp4|webm|vtt))(?:\/(\d+|complete))?$/,
      );
      if (upload && request.method === 'DELETE' && !upload[2]) {
        await store.cancelMedia(upload[1]);
        return json({ cancelled: true });
      }
      if (upload && request.method === 'POST') {
        if (upload[2] === 'complete') {
          const meta = await store.finishMedia(upload[1]);
          if (!meta) throw new HttpError(409, 'Upload is incomplete');
          return json(meta, 201);
        }
        if (!upload[2] || request.headers.get('content-type') !== 'application/octet-stream')
          throw new HttpError(415, 'Send a binary upload chunk');
        const part = Number(upload[2]);
        if (!Number.isSafeInteger(part) || part > 80)
          throw new HttpError(400, 'Invalid upload part');
        const bytes = await readLimited(request, mediaLimits.chunk);
        if (!(await store.appendMedia(upload[1], part, bytes.buffer as ArrayBuffer)))
          throw new HttpError(409, 'The upload chunk is out of order or has the wrong size');
        return json({ received: true });
      }
      const deleteKey = path.match(
        /^\/api\/admin\/media\/([a-f0-9-]{36}\.(?:png|jpg|webp|mp4|webm|vtt))$/,
      )?.[1];
      if (deleteKey && request.method === 'DELETE') {
        if (!(await store.deleteMedia(deleteKey)))
          throw new HttpError(
            409,
            'Remove this file from articles and gallery items before deleting it.',
          );
        return json({ deleted: true });
      }
      if (path === '/api/admin/media' && request.method === 'POST') {
        const type = request.headers.get('content-type');
        if (!type?.startsWith('multipart/form-data'))
          throw new HttpError(415, 'Use a media upload');
        // Large files use the bounded, staged upload API.
        const bytes = await readLimited(request, mediaLimits.chunk + 8192);
        let form: FormData;
        try {
          form = await new Response(bytes, {
            headers: { 'Content-Type': type },
          }).formData();
        } catch {
          throw new HttpError(400, 'Invalid upload');
        }
        const file = form.get('file');
        if (!(file instanceof File) || !file.size || file.size > mediaLimits.chunk)
          throw new HttpError(413, 'Use the admin chunked uploader for files above 256 KiB');
        const body = await file.arrayBuffer();
        const detected = detectMedia(new Uint8Array(body));
        if (!detected)
          throw new HttpError(
            415,
            'Supported formats: JPEG, PNG, WebP, MP4, WebM, WebVTT captions',
          );
        if (detected.type.startsWith('image/') && file.size > 8 * 1024 * 1024)
          throw new HttpError(413, 'Images must be 8 MB or smaller');
        const meta = {
          key: `${crypto.randomUUID()}.${detected.extension}`,
          name: file.name.slice(0, 180),
          type: detected.type,
          size: file.size,
          createdAt: new Date().toISOString(),
        };
        await store.putMedia(meta, body);
        return json(meta, 201);
      }
      if (path === '/api/admin/inquiries' && request.method === 'GET')
        return json(await store.inquiries());
      throw new HttpError(405, 'Unsupported administration action');
    }
    if (path === '/api/inquiries' && request.method === 'POST') {
      sameOrigin(request);
      const inquiry = validateInquiry(await readJson(request));
      if (!(await store.addInquiry(inquiry, await services.fingerprint(request))))
        throw new HttpError(429, 'Please wait before submitting another enquiry');
      return json({ received: true }, 201);
    }
    if (path === '/api/chat' && request.method === 'POST') {
      sameOrigin(request);
      return json(await chat(request, await readJson(request), services));
    }
    if (path === '/api/portfolio' && request.method === 'GET')
      return json((await store.portfolio()).filter((item) => item.status === 'published'));
    if (path === '/api/assistant/config' && request.method === 'GET')
      return json({
        available:
          !!services.ai?.key && ((await store.assistantSettings()) ?? defaultAssistant).enabled,
      });
    if (request.method !== 'GET' && request.method !== 'HEAD') return null;
    const mediaKey = path.match(/^\/media\/([a-f0-9-]{36}\.(?:png|jpg|webp|mp4|webm|vtt))$/)?.[1];
    if (mediaKey) {
      const meta = await store.mediaInfo(mediaKey);
      if (!meta) throw new HttpError(404, 'Media not found');
      const etag = `"${mediaKey}"`;
      const mediaHeaders = {
        ...headers,
        'Content-Type': meta.type,
        'Content-Length': String(meta.size),
        'Accept-Ranges': 'bytes',
        ETag: etag,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      };
      if (
        request.headers
          .get('if-none-match')
          ?.split(',')
          .map((v) => v.trim())
          .includes(etag)
      )
        return new Response(null, { status: 304, headers: mediaHeaders });
      if (request.method === 'HEAD') return new Response(null, { headers: mediaHeaders });
      const rangeHeader = request.headers.get('range');
      const ifRange = request.headers.get('if-range');
      let range: { start: number; end: number } | undefined;
      if (rangeHeader && (!ifRange || ifRange === etag)) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
        const start = match?.[1] ? Number(match[1]) : Math.max(0, meta.size - Number(match?.[2]));
        const end =
          match?.[1] && match[2] ? Math.min(Number(match[2]), meta.size - 1) : meta.size - 1;
        if (
          !match ||
          (!match[1] && !match[2]) ||
          !Number.isSafeInteger(start) ||
          !Number.isSafeInteger(end) ||
          start > end ||
          start >= meta.size ||
          (!match[1] && Number(match[2]) === 0)
        )
          return new Response(null, {
            status: 416,
            headers: {
              ...mediaHeaders,
              'Content-Length': '0',
              'Content-Range': `bytes */${meta.size}`,
            },
          });
        range = { start, end };
      }
      const media = await store.getMedia(mediaKey, range);
      if (!media) throw new HttpError(404, 'Media not found');
      return new Response(media.body, {
        status: range ? 206 : 200,
        headers: {
          ...mediaHeaders,
          'Content-Length': String(media.size),
          ...(range ? { 'Content-Range': `bytes ${range.start}-${range.end}/${meta.size}` } : {}),
        },
      });
    }
    if (path.startsWith('/api/')) throw new HttpError(404, 'Endpoint not found');
    const route = path.match(/^\/(fa|en)\/journal(?:\/([^/]+))?$/);
    if (route || path === '/sitemap.xml' || path === '/robots.txt') {
      const published = (await store.posts()).filter((post) => post.status === 'published');
      if (path === '/sitemap.xml')
        return new Response(sitemapXml(published, services.siteOrigin), {
          headers: {
            ...headers,
            'Content-Type': 'application/xml; charset=utf-8',
          },
        });
      if (path === '/robots.txt')
        return new Response(
          `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n${services.siteOrigin ? `Sitemap: ${services.siteOrigin}/sitemap.xml\n` : ''}`,
          {
            headers: {
              ...headers,
              'Content-Type': 'text/plain; charset=utf-8',
            },
          },
        );
      if (!route) return null;
      const locale = route[1] as 'fa' | 'en';
      const post = route[2]
        ? published.find((item) => item.locale === locale && item.slug === route[2])
        : null;
      if (route[2] && !post) throw new HttpError(404, 'Article not found');
      if (!url.pathname.endsWith('/'))
        return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 308);
      const body = post
        ? articleHtml(post, services.siteOrigin)
        : journalHtml(
            locale,
            published.filter((item) => item.locale === locale),
            services.siteOrigin,
          );
      return new Response(request.method === 'HEAD' ? null : body, {
        headers: {
          ...headers,
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy':
            "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
        },
      });
    }
    return null;
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    if (error instanceof URIError) return json({ error: 'Invalid URL' }, 400);
    console.error(
      'Content service error',
      error instanceof Error ? error.message : 'Unknown failure',
    );
    return json({ error: 'Content service is unavailable. Please retry.' }, 503);
  }
}
