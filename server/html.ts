import type { Post } from './types.ts';
import { escapeHtml as e, renderBody } from './validation.ts';

type Locale = 'fa' | 'en';
function document(
  locale: Locale,
  title: string,
  description: string,
  body: string,
  canonical?: string,
  extraHead = '',
) {
  const fa = locale === 'fa';
  return `<!doctype html><html lang="${locale}" dir="${fa ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#131b1e"><title>${e(title)} — BARGHINO</title><meta name="description" content="${e(description)}"><link rel="icon" href="/icon.svg"><link rel="stylesheet" href="/journal.css">${canonical ? `<link rel="canonical" href="${e(canonical)}"><meta property="og:url" content="${e(canonical)}">` : ''}<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}">${extraHead}</head><body><a class="skip" href="#main">${fa ? 'رفتن به محتوا' : 'Skip to content'}</a><header><a class="brand" href="/${locale}/" dir="ltr">BARGHINO<span>.</span></a><nav aria-label="${fa ? 'ناوبری' : 'Navigation'}"><a href="/${locale}/">${fa ? 'تجربهٔ سه‌بعدی' : 'The experience'} ↗</a><a href="/${fa ? 'en' : 'fa'}/journal/">${fa ? 'EN' : 'فارسی'}</a></nav></header>${body}<footer><a href="/${locale}/">${fa ? 'شروع یک پروژه' : 'Start a project'} ↗</a><span dir="ltr">BARGHINO / ELECTRICAL ENGINEERING</span></footer></body></html>`;
}

export function journalHtml(locale: Locale, posts: Post[], origin?: string) {
  const fa = locale === 'fa';
  const title = fa ? 'یادداشت‌های مدار' : 'The current journal.';
  const intro = fa
    ? 'ایده‌ها و تجربه‌ها؛ از نقشه تا روشنایی.'
    : 'Ideas from the installation. From blueprint to brilliance.';
  const list = posts
    .map(
      (post, index) =>
        `<article class="journal-row"><span class="index">${String(index + 1).padStart(2, '0')}</span><div><span class="category">${e(post.category || (fa ? 'مهندسی برق' : 'Electrical design'))}</span><h2><a href="/${locale}/journal/${encodeURIComponent(post.slug)}/">${e(post.title)}</a></h2><p>${e(post.excerpt)}</p><time datetime="${post.createdAt}">${new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(post.createdAt))}</time></div>${post.cover ? `<img src="${post.cover}" alt="${e(post.coverAlt)}" loading="lazy" width="480" height="320">` : `<div class="circuit-art" aria-hidden="true"><span></span><i></i><b>↗</b></div>`}</article>`,
    )
    .join('');
  return document(
    locale,
    title,
    intro,
    `<main id="main"><section class="journal-intro"><span class="eyebrow">BARGHINO / JOURNAL</span><h1>${title}</h1><p>${intro}</p></section><section aria-label="${fa ? 'مقاله‌ها' : 'Articles'}">${list || `<div class="empty"><span aria-hidden="true">＋</span><h2>${fa ? 'مدار تازه‌ای در راه است.' : 'A new connection is taking shape.'}</h2><p>${fa ? 'مقاله‌های تازه، به‌زودی در این‌جا.' : 'New articles will appear here as they are published.'}</p></div>`}</section></main>`,
    origin ? `${origin}/${locale}/journal/` : undefined,
    '<meta property="og:type" content="website">',
  );
}

export function articleHtml(post: Post, origin?: string) {
  const fa = post.locale === 'fa';
  const url = origin
    ? `${origin}/${post.locale}/journal/${encodeURIComponent(post.slug)}/`
    : undefined;
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    inLanguage: post.locale,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: 'Barghino' },
    ...(url
      ? {
          mainEntityOfPage: url,
          ...(post.cover ? { image: `${origin}${post.cover}` } : {}),
        }
      : {}),
  };
  const head = `<meta property="og:type" content="article"><meta property="article:published_time" content="${post.createdAt}"><meta property="article:modified_time" content="${post.updatedAt}">${post.cover && origin ? `<meta property="og:image" content="${e(origin + post.cover)}">` : ''}<script type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</script>`;
  const date = new Intl.DateTimeFormat(post.locale, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(post.createdAt));
  return document(
    post.locale,
    post.title,
    post.excerpt,
    `<main id="main" class="article"><a class="back" href="/${post.locale}/journal/">${fa ? 'بازگشت به مجله' : 'Back to journal'} ↗</a><span class="eyebrow">${e(post.category)}</span><h1>${e(post.title)}</h1><p class="deck">${e(post.excerpt)}</p><div class="byline"><span>${fa ? 'تحریریهٔ برقینو' : 'Barghino editorial'}</span><time datetime="${post.createdAt}">${date}</time></div>${post.cover ? `<img class="cover" src="${post.cover}" alt="${e(post.coverAlt)}" fetchpriority="high">` : ''}<div class="prose">${renderBody(post.body)}</div><aside>${fa ? 'برای پروژهٔ خودتان آماده‌اید؟' : 'Ready to connect your own project?'} <a href="/${post.locale}/">${fa ? 'ساختمان بعدی را با هم روشن کنیم' : 'Let’s bring the next building to life'} ↗</a></aside></main>`,
    url,
    head,
  );
}

export function sitemapXml(posts: Post[], origin?: string) {
  if (!origin)
    return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
  const paths = ['/fa/', '/en/', '/fa/journal/', '/en/journal/'];
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${e(origin + path)}</loc></url>`).join('')}${posts.map((post) => `<url><loc>${e(`${origin}/${post.locale}/journal/${encodeURIComponent(post.slug)}/`)}</loc><lastmod>${post.updatedAt}</lastmod></url>`).join('')}</urlset>`;
}
