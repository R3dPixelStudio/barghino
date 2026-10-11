# Barghino — power, in concert

Persian-first electrical contracting showcase: an integrated-system sculpture, quiet signals travelling along fixed routes, a moving media gallery and a four-question project brief. Next.js statically renders the bilingual landing and admin shell. A Cloudflare Worker serves the live CMS, journal, media and Groq assistant.

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

Local content and media live in `.data/content.sqlite`, excluded from Git. Back up the SQLite database using SQLite's backup tools (or stop the preview before copying it). Legacy `.data/media/` files are imported into SQLite on startup and retained as a backup. `CONTENT_DIR` and `PORT` override their defaults. Local data is not automatically uploaded to Cloudflare.

To connect Groq locally, create the ignored `.dev.vars` file containing `GROQ_API_KEY=your-key`, then restart preview. Production uses a Worker secret. Never use a `NEXT_PUBLIC_` variable for credentials.

## Structure

```text
src/app/[[...locale]]/            server-rendered home, metadata and fa/en root layout
src/app/admin/                   separate noindex admin shell
src/widgets/pulse-background/    one Canvas, procedural system core, flow/metal shaders and DOM control
src/widgets/brands/              equipment and installation tool brands
src/widgets/work-gallery/        mirrored carousel, swipe controls and inline media expansion
src/features/project-brief/     four professional selections and contact handoff
src/features/assistant/         accessible assistant dialog; in-memory conversation
src/features/editor/            journal, media, portfolio, assistant settings and inbox
src/entities/experience/        request-isolated Zustand state and motion preferences
src/shared/config/              locales, short copy and labeled concept previews
server/                         bounded HTTP API, validation, SQL repository, journal HTML
worker/index.ts                 one D1 database and Cloudflare Access JWT adapter
migrations/                     content, portfolio, settings and rate-limit schemas
scripts/                        local SQLite preview, optional seed and export normalization
public/previews/                optimized AI concept imagery, not completed projects
```

The active landing imports only the pulse Canvas. Older abstract shader/camera hooks remain available as reference scaffolding; they do not mount or preload assets on the active site.

## Experience and performance

- No building model, GLB, HDR, texture downloads or postprocessing in the landing.
- One Canvas at DPR 1 with 30 fps idle animation and event-driven demand rendering. The background shader uses stationary segmented routes and moving signal packets. Click/touch injects one bounded signal; a later tap replaces it. No expanding rings, sparks or geometry distortion. Pausing, isolation, reduced motion and hidden tabs stop continuous rendering and discard transient signals.
- The landing core consists of low-poly extruded plates, a machined circular isolator and six procedural conductors. Its three routes represent infrastructure, protection and automation. Metal uses a subtle procedural finish and a 64px studio environment captured once with Drei Lightformers; no environment asset is fetched. Pointer movement adjusts the viewing angle gently. The core is culled when its DOM anchor leaves the viewport.
- The system is connected by default. The keyboard-accessible core isolates/reconnects the visual network; selecting a discipline reconnects and highlights its route. Only an explicit on/off preference is restored from session storage. WebGL failure exposes a static system illustration and background fallback. Navigation remains available.
- Locale affects both document direction and the shader's spatial composition. No negative geometry scaling. Power preference alone persists in session storage.
- GPU writes target `material.current.uniforms`: installed Fiber copies uniform records into the live material. Browser checks verify the actual GPU power upload and draw-call settling.
- Event listeners, observers, timers and subscriptions clean up. R3F disposes declarative geometries/materials on unmount; Drei disposes the generated environment render target. DOM measurements are coalesced into the next frame after scroll, resize or font loading. Explicit negative frame priorities compute shared signals first, apply the core transform second and update conductor uniforms third; single paused frames cannot consume a stale anchor. No background GSAP timeline is mounted by this experience.
- The active gallery card expands and returns to color; surrounding cards remain smaller and monochrome. Previous/next, selecting a card, swiping and keyboard selection are supported. Clicking a card brings it closer inside the carousel and reveals its project note. Click again, press Escape or use the return button to collapse it. Films play inline with native controls only while expanded; collapsing or changing selection pauses and unmounts playback.

## Content operations

Upload your images/videos in **Media library**, then select them in **Portfolio gallery**. Provide Persian/English titles and image descriptions, an optional video poster, project description, display order and publication status. The first published entry replaces all concept previews. Drafts never reach the public API. Conflicting saves/deletions fail instead of overwriting a newer revision.

Images: JPEG, PNG or WebP, up to 8 MB. Films: MP4 or WebM, up to 20 MB. Gallery captions: WebVTT, up to 512 KB. Upload spoken-film captions and an authored description; select the actual caption language in the editor. Larger films should be compressed before uploading. The server bounds request bodies, checks format signatures and rejects active SVG/HTML. Uploaded media URLs are public; keep private documents out of the media library.

The journal editor supports drafts, publishing/unpublishing, bilingual articles, editable slugs, summaries, categories, covers and preview. Paragraphs, `##`/`###` headings, `-` lists, `![description](/media/id.webp)` and `@video(/media/id.mp4)` are supported. Authored HTML is escaped. Include film transcripts in article text. Published HTML, metadata, BlogPosting JSON-LD and the sitemap update without a Next rebuild.

The brief records project type, current stage, services and timing, then contact details and optional location/notes. Enquiries appear in the admin inbox; no email notification integration is configured. Five submissions per hashed IP per 30 minutes are allowed.

The assistant uses server-only Groq credentials, owner-editable persona/knowledge/model, a 20-request/hour hashed-IP cap, bounded history and a 20-second provider timeout. It cannot change content or submit enquiries. Replies are plain text; contract output is an editable initial draft. Chats stay in browser memory and are sent to Groq for generation. Provider failure preserves the visitor's input and does not substitute a fictional AI reply. No live provider request has been verified without a supplied key.

## Deployment and verification

See [Cloudflare deployment](docs/DEPLOYMENT.md) for D1, Access, Groq secrets, Git integration and a future domain. This application targets **Workers with static assets**; a plain static Pages upload does not run its CMS/API.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run worker:check
npm run test:d1
npm audit
```

Media uses 256 KiB BLOB chunks in D1. The admin sends one chunk per request; each streaming read retrieves at most four rows (1 MiB). Byte-range requests support video seeking; public full responses use the Worker Cache API and immutable browser caching. The media library is capped at 400 MB, reserving room below D1 Free's 500 MB database limit for content and SQLite overhead. Abandoned uploads expire after an hour and are cleared on the next upload. Admin shows usage and can delete unused media. Article/gallery references are transactionally protected; referenced files cannot be removed. Files are public and browser/edge cached copies may remain after deletion. This is a bounded library for compressed images and short films, not unlimited video hosting.

The Edge suite uses port 3200 and isolated test content. It verifies server HTML, mobile layouts, carousel/swipe/inline expansion controls, actual GPU uniforms and pause/reduced-motion and cross-section behavior, context loss, locale switching, journal publishing, portfolio administration, guided enquiry persistence and assistant success/failure UI. Groq responses in browser tests are mocked; unit tests check the real server request construction with a substituted provider transport. Worker dry-run bundles without deploying. Remote D1 and Access sign-in need the configured Cloudflare account.

Concept preview prompts and asset provenance: [visual assets](docs/VISUAL-ASSETS.md).

`test:d1` runs an isolated Miniflare D1/Worker check for binary uploads, ranges, protected admin and transactional file deletion. It creates no remote resources.

The circular isolator is the sole power switch, aligned to the physical core in both locales. A slow machined arc rotates while connected; the glyph blends between power, protection and automation. On mobile the core follows the headline, before the introduction. The accent is `#f7db05` throughout the DOM, shader, editor, journal and favicon.
