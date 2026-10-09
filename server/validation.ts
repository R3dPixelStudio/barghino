import type { AssistantSettings, GalleryItem, Post } from './types.ts';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function field(input: Record<string, unknown>, key: string, max: number, required = false) {
  const value = input[key];
  if (typeof value !== 'string' || value.length > max || (required && !value.trim()))
    throw new HttpError(400, `Invalid ${key}`);
  return value.trim();
}

export function validatePost(input: unknown, existing?: Post): Post {
  if (!input || typeof input !== 'object') throw new HttpError(400, 'Post is required');
  const value = input as Record<string, unknown>;
  const slug = field(value, 'slug', 140, true);
  if (!/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(slug))
    throw new HttpError(400, 'Use letters, numbers, and hyphens for the URL');
  if (value.locale !== 'fa' && value.locale !== 'en') throw new HttpError(400, 'Invalid language');
  if (value.status !== 'draft' && value.status !== 'published')
    throw new HttpError(400, 'Invalid status');
  const cover = field(value, 'cover', 180);
  if (cover && !/^\/media\/[a-f0-9-]+\.(png|jpg|webp)$/.test(cover))
    throw new HttpError(400, 'Choose an uploaded image');
  const coverAlt = field(value, 'coverAlt', 240, !!cover && value.status === 'published');
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? crypto.randomUUID(),
    locale: value.locale,
    slug,
    title: field(value, 'title', 180, true),
    excerpt: field(value, 'excerpt', 320, value.status === 'published'),
    body: field(value, 'body', 60000, value.status === 'published'),
    category: field(value, 'category', 60),
    cover,
    coverAlt,
    status: value.status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    revision: crypto.randomUUID(),
  };
}

export function validateInquiry(input: unknown) {
  if (!input || typeof input !== 'object') throw new HttpError(400, 'Invalid enquiry');
  const value = input as Record<string, unknown>;
  if (value.website) throw new HttpError(400, 'Unable to submit');
  const type = field(value, 'type', 30, true);
  if (!['development', 'home', 'renovation'].includes(type))
    throw new HttpError(400, 'Invalid project type');
  const contact = field(value, 'contact', 180, true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && !/^[+\d۰-۹٠-٩\s()-]{7,30}$/.test(contact))
    throw new HttpError(400, 'Enter an email address or phone number');
  const guided = value.phase !== undefined;
  if (
    guided &&
    (!['planning', 'construction', 'existing'].includes(String(value.phase)) ||
      !['soon', 'quarter', 'exploring'].includes(String(value.timeline)) ||
      !Array.isArray(value.services) ||
      !value.services.length ||
      value.services.length > 3 ||
      value.services.some((s) => !['installation', 'lighting', 'smart'].includes(s)))
  )
    throw new HttpError(400, 'Complete the project selections');
  return {
    id: crypto.randomUUID(),
    name: field(value, 'name', 100, true),
    contact,
    message: field(value, 'message', 3000, !guided),
    type,
    ...(guided
      ? {
          phase: String(value.phase),
          services: [...new Set(value.services as string[])],
          timeline: String(value.timeline),
          location: field({ location: '', ...value }, 'location', 120),
        }
      : {}),
    locale: value.locale === 'en' ? ('en' as const) : ('fa' as const),
    createdAt: new Date().toISOString(),
  };
}

const uploaded = /^\/media\/[a-f0-9-]{36}\.(png|jpg|webp|mp4|webm)$/;
export function validateWork(value: Record<string, unknown>, existing?: GalleryItem): GalleryItem {
  const src = field(value, 'src', 180, true);
  const poster = field(value, 'poster', 180);
  const captions = field({ captions: '', ...value }, 'captions', 180);
  const captionLanguage = value.captionLanguage ?? 'fa';
  if (captionLanguage !== 'fa' && captionLanguage !== 'en')
    throw new HttpError(400, 'Invalid caption language');
  if (captions && !/^\/media\/[a-f0-9-]{36}\.vtt$/.test(captions))
    throw new HttpError(400, 'Choose uploaded WebVTT captions');
  if (!uploaded.test(src) || (poster && !/^\/media\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(poster)))
    throw new HttpError(400, 'Choose uploaded media');
  const kind = /\.(mp4|webm)$/.test(src) ? 'video' : 'image';
  if (!Number.isInteger(value.order) || Number(value.order) < 0 || Number(value.order) > 10000)
    throw new HttpError(400, 'Invalid gallery order');
  if (value.status !== 'draft' && value.status !== 'published')
    throw new HttpError(400, 'Invalid status');
  return {
    id: existing?.id ?? crypto.randomUUID(),
    src,
    poster,
    captions,
    captionLanguage,
    kind,
    order: Number(value.order),
    status: value.status,
    concept: false,
    revision: crypto.randomUUID(),
    titleFa: field(value, 'titleFa', 140, true),
    titleEn: field(value, 'titleEn', 140, true),
    categoryFa: field(value, 'categoryFa', 80),
    categoryEn: field(value, 'categoryEn', 80),
    descriptionFa: field(value, 'descriptionFa', 1500),
    descriptionEn: field(value, 'descriptionEn', 1500),
    altFa: field(value, 'altFa', 240, kind === 'image'),
    altEn: field(value, 'altEn', 240, kind === 'image'),
    year: field(value, 'year', 20),
    location: field(value, 'location', 120),
  };
}
export function validateAssistantSettings(value: Record<string, unknown>): AssistantSettings {
  const model = field(value, 'model', 120, true);
  if (!/^[\w/.-]+$/.test(model) || typeof value.enabled !== 'boolean')
    throw new HttpError(400, 'Invalid assistant settings');
  return {
    persona: field(value, 'persona', 12000, true),
    knowledge: field(value, 'knowledge', 30000),
    model,
    enabled: value.enabled,
    revision: crypto.randomUUID(),
  };
}

// Escaping happens before any formatting; authored HTML never becomes executable markup.
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ??
      character,
  );
}

export function renderBody(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((block) => {
      const image = block
        .trim()
        .match(/^!\[([^\]\n]{1,240})\]\((\/media\/[a-f0-9-]+\.(?:png|jpg|webp))\)$/);
      if (image)
        return `<figure><img src="${image[2]}" alt="${escapeHtml(image[1])}" loading="lazy" decoding="async"><figcaption>${escapeHtml(image[1])}</figcaption></figure>`;
      const video = block.trim().match(/^@video\((\/media\/[a-f0-9-]+\.(?:mp4|webm))\)$/);
      if (video) return `<video src="${video[1]}" controls preload="metadata" playsinline></video>`;
      if (block.startsWith('## ')) return `<h2>${escapeHtml(block.slice(3))}</h2>`;
      if (block.startsWith('### ')) return `<h3>${escapeHtml(block.slice(4))}</h3>`;
      if (block.split('\n').every((line) => line.startsWith('- ')))
        return `<ul>${block
          .split('\n')
          .map((line) => `<li>${escapeHtml(line.slice(2))}</li>`)
          .join('')}</ul>`;
      return `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

export function detectMedia(bytes: Uint8Array): { extension: string; type: string } | null {
  const start = Array.from(bytes.slice(0, 12));
  if (start.slice(0, 8).join() === '137,80,78,71,13,10,26,10')
    return { extension: 'png', type: 'image/png' };
  if (start[0] === 255 && start[1] === 216 && start[2] === 255)
    return { extension: 'jpg', type: 'image/jpeg' };
  const ascii = new TextDecoder().decode(bytes.slice(0, 16));
  if (bytes.length <= 512 * 1024 && /^(?:\uFEFF)?WEBVTT(?:\s|$)/.test(ascii))
    return { extension: 'vtt', type: 'text/vtt; charset=utf-8' };
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP')
    return { extension: 'webp', type: 'image/webp' };
  if (
    ascii.slice(4, 8) === 'ftyp' &&
    ['isom', 'iso2', 'mp41', 'mp42', 'avc1', 'M4V '].includes(ascii.slice(8, 12))
  )
    return { extension: 'mp4', type: 'video/mp4' };
  if (
    start.slice(0, 4).join() === '26,69,223,163' &&
    new TextDecoder().decode(bytes.slice(0, 64)).includes('webm')
  )
    return { extension: 'webm', type: 'video/webm' };
  return null;
}
