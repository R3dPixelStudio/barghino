import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/shared/config/site';

export const dynamic = 'force-static';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
    ...(siteOrigin ? { sitemap: new URL('/sitemap.xml', siteOrigin).href } : {}),
  };
}
