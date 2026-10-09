import type { D1Database, Fetcher, ExecutionContext } from '@cloudflare/workers-types';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { handleContent } from '../server/handler.ts';
import { Repository } from '../server/repository.ts';
import { d1Driver } from '../server/d1.ts';

export type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  SITE_ORIGIN?: string;
  IP_HASH_SALT?: string;
  GROQ_API_KEY?: string;
};
const keysets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function authenticate(
  request: Request,
  env: Pick<Env, 'ACCESS_TEAM_DOMAIN' | 'ACCESS_AUD'>,
) {
  const issuer = env.ACCESS_TEAM_DOMAIN?.replace(/\/$/, '');
  const token = request.headers.get('cf-access-jwt-assertion');
  if (
    !issuer ||
    !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) ||
    !env.ACCESS_AUD ||
    !token
  )
    return null;
  try {
    let keys = keysets.get(issuer);
    if (!keys) {
      keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
      keysets.set(issuer, keys);
    }
    const { payload } = await jwtVerify(token, keys, {
      issuer,
      audience: env.ACCESS_AUD,
      algorithms: ['RS256'],
    });
    if (typeof payload.email !== 'string') return null;
    return { email: payload.email, local: false };
  } catch {
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext) {
    const url = new URL(request.url);
    let path: string;
    try {
      path = decodeURIComponent(url.pathname);
    } catch {
      return new Response('Invalid URL', { status: 400 });
    }
    if ((path === '/admin' || path.startsWith('/admin/')) && !(await authenticate(request, env))) {
      return new Response(
        'Administrator access requires Cloudflare Access. Configure the team domain, audience and an allow policy before publishing.',
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
        },
      );
    }
    const store = new Repository(d1Driver(env.DB));
    const cache = (
      caches as unknown as {
        default: {
          match(request: Request): Promise<Response | undefined>;
          put(request: Request, response: Response): Promise<void>;
        };
      }
    ).default;
    const cacheable =
      request.method === 'GET' &&
      /^\/media\/[a-f0-9-]{36}\.(png|jpg|webp|mp4|webm|vtt)$/.test(path);
    if (cacheable && !request.headers.has('if-range')) {
      const cached = await cache.match(request);
      if (cached) return cached;
    }
    const response = await handleContent(request, {
      store,
      authenticate: (req) => authenticate(req, env),
      siteOrigin: env.SITE_ORIGIN,
      ai: { key: env.GROQ_API_KEY },
      fingerprint: async (req) => {
        if (!env.IP_HASH_SALT) throw new Error('Configure IP_HASH_SALT before accepting enquiries');
        const digest = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(
            `${env.IP_HASH_SALT}:${req.headers.get('cf-connecting-ip') ?? 'unknown'}`,
          ),
        );
        return Array.from(new Uint8Array(digest), (byte) =>
          byte.toString(16).padStart(2, '0'),
        ).join('');
      },
    });
    if (
      cacheable &&
      response?.status === 200 &&
      !request.headers.has('range') &&
      !request.headers.has('if-none-match')
    )
      context.waitUntil(cache.put(request, response.clone()).catch(() => undefined));
    return response ?? env.ASSETS.fetch(request as unknown as Parameters<Fetcher['fetch']>[0]);
  },
};
