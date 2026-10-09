import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/shared/config/site';

export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteOrigin) return [];
  return ['fa', 'en'].map((locale) => ({
    url: new URL(`/${locale}/`, siteOrigin).href,
    alternates: {
      languages: {
        fa: new URL('/fa/', siteOrigin).href,
        en: new URL('/en/', siteOrigin).href,
      },
    },
  }));
}
