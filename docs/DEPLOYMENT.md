# Cloudflare deployment

Use **Cloudflare Workers with static assets**, one D1 database for content and media and Access for the administrator. The home/editor are Next static exports; the Worker handles the dynamic journal and APIs on the same origin. No Cloudflare resource or live deployment was created during local development.

## 1. Create storage

Install Node 24 LTS, run `npm ci`, then sign in:

```sh
npx wrangler login
npx wrangler d1 create barghino-content
```

Replace the all-zero `database_id` in `wrangler.jsonc` with the returned D1 ID. Keep the database binding named `DB`. No R2 bucket, KV namespace or separate media service is needed.

Apply all three migrations:

```sh
npx wrangler d1 migrations apply barghino-content --remote
```

### D1-only media budget

Apply **all three migrations**, including `0003_d1_media.sql`. Media is stored in binary 256 KiB chunks, below D1's 2,000,000-byte per-row limit. The admin uploads one bounded chunk per request; completion atomically publishes the file with four write statements and four change-count reads. Reads fetch at most four chunks (1 MiB) per query, keeping the largest supported film below the Free 50-query-per-invocation limit. Saving an article or gallery item with media references uses three write statements and three change-count reads. Incomplete uploads are invisible publicly, reserve their budget atomically, and expire after one hour; the next upload cleans up abandoned reservations. The free database maximum is 500 MB; the application limits media payloads to 400 MB to reserve space for text, indexes and database overhead. The meter measures media payload and upload reservation bytes, not total database allocation: also watch D1 Metrics. Images are limited to 8 MiB; videos to 20 MiB; captions to 512 KiB. Compress footage before uploading. Use the admin library to remove files after removing their article/gallery references.

Public files use immutable browser caching. Full GET responses are cached at the edge, and video byte ranges stream only the needed chunks. Cache misses still consume D1 reads and Worker CPU; the Free plan has daily usage limits. Check the official limits/pricing and your account dashboard. This design does not guarantee unlimited traffic or storage. Groq's separate account quotas still apply. No remote deployment or paid resource is provisioned by these instructions.

## 2. Protect the editor

In Zero Trust, create a self-hosted Access application for your planned hostname and paths `/admin`, `/admin/*` and `/api/admin/*`. Include them under one application/audience. Create an Allow policy for your administrator email only, choose your sign-in method and copy the application audience (AUD).

Set these Wrangler variables:

- `ACCESS_TEAM_DOMAIN`: your full `https://your-team.cloudflareaccess.com` issuer.
- `ACCESS_AUD`: the application's audience string.
- `SITE_ORIGIN`: the actual public HTTPS origin, without a trailing slash.

The Worker verifies signed Access JWTs. Missing configuration denies admin access; an unprotected alternate origin cannot bypass it. Cover every hostname you will use for administration, including the initial workers.dev hostname if supported by your Access configuration. If Access cannot cover the initial hostname, keep administration denied there and use a configured custom domain for it.

## 3. Add secrets and build metadata

```sh
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put IP_HASH_SALT
```

Paste your Groq key only at the secret prompt. For `IP_HASH_SALT`, use a long random value. Never commit either value or store it in the admin persona. In the dashboard these belong to Worker runtime **Secrets**, not public build variables. Missing Groq configuration leaves the assistant visibly disconnected. Missing the hashing salt prevents accepting public enquiries/chat.

Set build environment `NEXT_PUBLIC_SITE_URL` to the same HTTPS origin as `SITE_ORIGIN`. This supplies home canonical/Open Graph URLs; live journal metadata uses `SITE_ORIGIN` at runtime.

## 4. Build and deploy

```sh
npm run build
npm run worker:check
npx wrangler deploy
```

Open the returned URL at `/fa/`. Check `/en/`, `/fa/journal/`, `/admin/` and the project brief. Sign in through Access before publishing content. Local SQLite/uploads are not copied to D1; upload your real media and articles through the deployed editor.

For GitHub updates, connect the public repository in **Workers & Pages → your Worker → Settings → Builds**. Use repository root, Node 24, build command `npm run build`, deploy command `npx wrangler deploy`, and the intended production branch. Commit the correct D1 ID and nonsecret variables. Keep runtime secrets configured on the Worker. Cloudflare Builds installs project dependencies before your build; preserve `package-lock.json`.

## 5. Connect the future domain

Add the purchased domain to Cloudflare and complete its DNS/nameserver activation. In the Worker, add the hostname under **Settings → Domains & Routes → Custom Domain**. Update Access application hostnames, `SITE_ORIGIN` and build variable `NEXT_PUBLIC_SITE_URL`, then rebuild/deploy. Use the same primary origin for canonical URLs. Verify the sitemap at `/sitemap.xml` after publishing an article.

## Admin workflow

1. Upload image/video/poster/captions in Media library.
2. Add a Portfolio gallery item with bilingual titles and image descriptions. Publish it; concept previews disappear automatically.
3. Edit Assistant settings: tone/persona, confirmed company information, FAQs, model and enabled state. The key remains a Cloudflare secret.
4. Create/publish journal articles for your real services and project stories. SEO routes are server-produced HTML.
5. Review Project enquiries. Contact the visitor using their supplied details; outbound email is not configured.

## Official references

- [Static asset binding](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Workers Builds and Git integration](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [D1 getting started](https://developers.cloudflare.com/d1/get-started/)
- [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [D1 pricing and daily free allowances](https://developers.cloudflare.com/d1/platform/pricing/)
- [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Groq text generation](https://console.groq.com/docs/text-chat)
