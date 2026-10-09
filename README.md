# Barghino — current, considered

Persian-first electrical contracting showcase: a restrained pulse shader, a moving media gallery and a four-question project brief. Next.js statically renders the bilingual landing and admin shell. A Cloudflare Worker serves the live CMS, journal, media and Groq assistant.

## Local preview

Use Node 24 LTS. Dependencies are pinned in `package-lock.json`.

```sh
npm ci
npm run build
npm run preview
```

- Website: http://127.0.0.1:3100/fa/ and /en/
- Editor: http://127.0.0.1:3100/admin/
- Journal: http://127.0.0.1:3100/fa/journal/

The integrated preview binds to loopback, validates the Host header and grants local editor access. Production has no local-auth bypass. `npm run dev` is frontend-only; use build + preview for the CMS. Restart preview after server changes. Optional starter articles: `npm run content:seed`.

Local data lives in `.data/content.sqlite` and `.data/media/`, excluded from Git. Back up both before moving your local installation. `CONTENT_DIR` and `PORT` override their defaults. Local data is not automatically uploaded to Cloudflare.

To connect Groq locally, create the ignored `.dev.vars` file containing `GROQ_API_KEY=your-key`, then restart preview. Production uses a Worker secret. Never use a `NEXT_PUBLIC_` variable for credentials.

## Structure

```text
src/app/[[...locale]]/            server-rendered home, metadata and fa/en root layout
src/app/admin/                   separate noindex admin shell
src/widgets/pulse-background/    one demand-rendered shader Canvas and DOM switch
src/widgets/work-gallery/        mirrored carousel, swipe controls and media dialog
src/features/project-brief/     four professional selections and contact handoff
src/features/assistant/         accessible assistant dialog; in-memory conversation
src/features/editor/            journal, media, portfolio, assistant settings and inbox
src/entities/experience/        request-isolated Zustand state and motion preferences
src/shared/config/              locales, short copy and labeled concept previews
server/                         bounded HTTP API, validation, SQL repository, journal HTML
worker/index.ts                 D1, private R2 bucket and Cloudflare Access JWT adapter
migrations/                     content, portfolio, settings and rate-limit schemas
scripts/                        local SQLite preview, optional seed and export normalization
public/previews/                optimized AI concept imagery, not completed projects
```

The active landing imports only the pulse Canvas. Older abstract shader/camera hooks remain available as reference scaffolding; they do not mount or preload assets on the active site.

## Experience and performance

- No building model, GLB, HDR, texture downloads or postprocessing in the landing.
- One plane, one shader material, DPR 1, demand rendering. Powered animation runs only while visible and motion is enabled. Pointer movement updates uniforms without React state updates per frame.
- The DOM switch works with keyboard input and announces its state. Navigation is always available. WebGL failure exposes a static pulse fallback.
- Locale affects both document direction and the shader's spatial composition. No negative geometry scaling. Power preference alone persists in session storage.
- GPU writes target `material.current.uniforms`: installed Fiber copies uniform records into the live material. Browser checks verify the actual GPU power upload and draw-call settling.
- Event listeners, observers and subscriptions clean up. R3F disposes declarative plane geometry and shader material on unmount. No background GSAP timeline is mounted by this experience.
- The active gallery card expands and returns to color; surrounding cards remain smaller and monochrome. Previous/next, selecting a card, swiping, keyboard selection and full-screen media are supported. Films load only when opened, with native controls; closing unmounts playback.

## Content operations

Upload your images/videos in **Media library**, then select them in **Portfolio gallery**. Provide Persian/English titles and image descriptions, an optional video poster, project description, display order and publication status. The first published entry replaces all concept previews. Drafts never reach the public API. Conflicting saves/deletions fail instead of overwriting a newer revision.

Images: JPEG, PNG or WebP, up to 8 MB. Films: MP4 or WebM, up to 20 MB. Gallery captions: WebVTT, up to 512 KB. Upload spoken-film captions and an authored description; select the actual caption language in the editor. Larger films should be compressed before uploading. The server bounds request bodies, checks format signatures and rejects active SVG/HTML. Uploaded media URLs are public; keep private documents out of the media library.

The journal editor supports drafts, publishing/unpublishing, bilingual articles, editable slugs, summaries, categories, covers and preview. Paragraphs, `##`/`###` headings, `-` lists, `![description](/media/id.webp)` and `@video(/media/id.mp4)` are supported. Authored HTML is escaped. Include film transcripts in article text. Published HTML, metadata, BlogPosting JSON-LD and the sitemap update without a Next rebuild.

The brief records project type, current stage, services and timing, then contact details and optional location/notes. Enquiries appear in the admin inbox; no email notification integration is configured. Five submissions per hashed IP per 30 minutes are allowed.

The assistant uses server-only Groq credentials, owner-editable persona/knowledge/model, a 20-request/hour hashed-IP cap, bounded history and a 20-second provider timeout. It cannot change content or submit enquiries. Replies are plain text; contract output is an editable initial draft. Chats stay in browser memory and are sent to Groq for generation. Provider failure preserves the visitor's input and does not substitute a fictional AI reply. No live provider request has been verified without a supplied key.

## Deployment and verification

See [Cloudflare deployment](docs/DEPLOYMENT.md) for D1/R2, Access, Groq secrets, Git integration and a future domain. This application targets **Workers with static assets**; a plain static Pages upload does not run its CMS/API.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run worker:check
npm audit
```

The Edge suite uses port 3200 and isolated test content. It verifies server HTML, mobile layouts, carousel/swipe/dialog controls, actual GPU uniforms and pause/offscreen/reduced-motion behavior, context loss, locale switching, journal publishing, portfolio administration, guided enquiry persistence and assistant success/failure UI. Groq responses in browser tests are mocked; unit tests check the real server request construction with a substituted provider transport. Worker dry-run bundles without deploying. Remote D1/R2 and Access sign-in need the configured Cloudflare account.

Concept preview prompts and asset provenance: [visual assets](docs/VISUAL-ASSETS.md).
