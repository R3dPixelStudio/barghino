'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import type { Inquiry, Media, Post } from '../../../../server/types';
import { escapeHtml, renderBody } from '../../../../server/validation';
import { AssistantEditor, PortfolioEditor } from './ExperienceEditors';

type Draft = Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'revision'> & {
  id?: string;
  revision?: string;
};
const blank = (): Draft => ({
  locale: 'fa',
  slug: '',
  title: '',
  excerpt: '',
  body: '',
  category: '',
  cover: '',
  coverAlt: '',
  status: 'draft',
});

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}

export function AdminPanel() {
  const [language, setLanguage] = useState<'fa' | 'en'>('fa');
  const fa = language === 'fa';
  const t = (persian: string, english: string) => (fa ? persian : english);
  const [user, setUser] = useState<{ email: string; local: boolean } | null>(null);
  const [tab, setTab] = useState<'posts' | 'media' | 'inquiries' | 'portfolio' | 'assistant'>(
    'posts',
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [draft, setDraft] = useState<Draft>(blank);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const textArea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const session = await api<{ email: string; local: boolean }>('session', {
          signal: controller.signal,
        });
        const [saved, files, leads] = await Promise.all([
          api<Post[]>('posts', { signal: controller.signal }),
          api<Media[]>('media', { signal: controller.signal }),
          api<Inquiry[]>('inquiries', { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) {
          setUser(session);
          setPosts(saved);
          setMedia(files);
          setInquiries(leads);
        }
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = fa ? 'rtl' : 'ltr';
  }, [language, fa]);
  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    if (dirty) window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty]);

  function update(values: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...values }));
    setDirty(true);
    setMessage('');
  }
  function select(post?: Post) {
    if (
      dirty &&
      !window.confirm(
        t('تغییرات ذخیره نشده است. از آن‌ها صرف‌نظر می‌کنید؟', 'Discard unsaved changes?'),
      )
    )
      return;
    setDraft(post ?? blank());
    setDirty(false);
    setTab('posts');
    setPreview(false);
    setMessage('');
    setError('');
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const saved = await api<Post>('posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      setDraft(saved);
      setDirty(false);
      setPosts((current) => [saved, ...current.filter((post) => post.id !== saved.id)]);
      setMessage(
        t(
          saved.status === 'published'
            ? 'مقاله منتشر شد و در مجله قابل مشاهده است.'
            : 'پیش‌نویس ذخیره شد.',
          saved.status === 'published'
            ? 'Published. Your article is now in the journal.'
            : 'Draft saved.',
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save');
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (
      !draft.id ||
      busy ||
      !window.confirm(
        t(
          'این مقاله حذف شود؟ این کار قابل بازگشت نیست.',
          'Delete this article? This cannot be undone.',
        ),
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      await api(`posts/${draft.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: draft.revision }),
      });
      setPosts((current) => current.filter((post) => post.id !== draft.id));
      setDraft(blank());
      setDirty(false);
      setMessage(t('مقاله حذف شد.', 'Article deleted.'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete');
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File | undefined) {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const form = new FormData();
      form.append('file', file);
      const saved = await api<Media>('media', { method: 'POST', body: form });
      setMedia((current) => [saved, ...current]);
      setMessage(t('رسانه بارگذاری شد.', 'Media uploaded.'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }
  function insert(value: string) {
    const field = textArea.current;
    const position = field?.selectionStart ?? draft.body.length;
    update({
      body: `${draft.body.slice(0, position)}\n\n${value}\n\n${draft.body.slice(position)}`,
    });
    setTab('posts');
    setPreview(false);
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <a className="brand" href={`/${language}/`} dir="ltr">
          BARGHINO<span className="brand-dot">.</span>
        </a>
        <span>{t('اتاق کنترل محتوا', 'CONTENT CONTROL ROOM')}</span>
        <button type="button" className="text-button" onClick={() => setLanguage(fa ? 'en' : 'fa')}>
          {fa ? 'EN' : 'فارسی'}
        </button>
      </header>
      {loading ? (
        <p className="admin-loading" role="status">
          {t('در حال اتصال…', 'Connecting…')}
        </p>
      ) : !user ? (
        <section className="admin-access">
          <h1>{t('ورود به مدیریت', 'Administrator access')}</h1>
          <p role="alert">{error}</p>
          <p>
            {t(
              'نسخهٔ محلی را با npm run preview اجرا کنید. در نسخهٔ آنلاین، ورود از طریق Cloudflare Access انجام می‌شود.',
              'Run npm run preview for the local editor. The deployed editor requires Cloudflare Access sign-in.',
            )}
          </p>
          <a href={`/${language}/`}>{t('بازگشت به سایت', 'Back to site')} ↗</a>
        </section>
      ) : (
        <>
          <div className="admin-session">
            <span className="session-led" />
            <span>
              {user.local
                ? t(
                    'حالت محلی — اطلاعات روی همین رایانه ذخیره می‌شود.',
                    'LOCAL MODE — content is saved on this computer.',
                  )
                : user.email}
            </span>
            {!user.local && <a href="/cdn-cgi/access/logout">{t('خروج', 'Sign out')}</a>}
          </div>
          <div className="admin-body">
            <aside className="admin-sidebar">
              <nav aria-label={t('مدیریت محتوا', 'Content management')}>
                <button
                  type="button"
                  aria-current={tab === 'posts' ? 'page' : undefined}
                  onClick={() => setTab('posts')}
                >
                  {t('مقاله‌ها', 'Articles')}
                  <span>{posts.length}</span>
                </button>
                <button
                  type="button"
                  aria-current={tab === 'media' ? 'page' : undefined}
                  onClick={() => setTab('media')}
                >
                  {t('رسانه‌ها', 'Media library')}
                  <span>{media.length}</span>
                </button>
                <button
                  type="button"
                  aria-current={tab === 'portfolio' ? 'page' : undefined}
                  onClick={() => setTab('portfolio')}
                >
                  {t('گالری کارنامه', 'Portfolio gallery')}
                </button>
                <button
                  type="button"
                  aria-current={tab === 'assistant' ? 'page' : undefined}
                  onClick={() => setTab('assistant')}
                >
                  {t('تنظیمات دستیار', 'Assistant settings')}
                </button>
                <button
                  type="button"
                  aria-current={tab === 'inquiries' ? 'page' : undefined}
                  onClick={() => setTab('inquiries')}
                >
                  {t('درخواست پروژه', 'Project enquiries')}
                  <span>{inquiries.length}</span>
                </button>
              </nav>
              <button className="new-post" type="button" onClick={() => select()} disabled={busy}>
                ＋ {t('مقالهٔ تازه', 'New article')}
              </button>
              <div className="post-list">
                {posts.map((post) => (
                  <button
                    type="button"
                    disabled={busy}
                    key={post.id}
                    aria-pressed={draft.id === post.id}
                    onClick={() => select(post)}
                  >
                    <small>
                      {post.locale.toUpperCase()} ·{' '}
                      {post.status === 'published'
                        ? t('منتشرشده', 'Published')
                        : t('پیش‌نویس', 'Draft')}
                    </small>
                    <span>{post.title}</span>
                  </button>
                ))}
              </div>
              <a className="admin-view-site" href={`/${language}/journal/`}>
                {t('مشاهدهٔ مجله', 'Open journal')} ↗
              </a>
            </aside>
            <main className="admin-main" id="main">
              {error && (
                <div className="admin-notice error" role="alert">
                  {error}
                </div>
              )}
              {message && (
                <div className="admin-notice" role="status">
                  {message}
                </div>
              )}
              <div hidden={tab !== 'portfolio'}>
                <PortfolioEditor media={media} fa={fa} />
              </div>
              <div hidden={tab !== 'assistant'}>
                <AssistantEditor fa={fa} />
              </div>
              {tab === 'posts' && (
                <form className="editor-form" onSubmit={save}>
                  <div className="admin-title">
                    <div>
                      <span className="chapter-index">EDITOR / {draft.locale.toUpperCase()}</span>
                      <h1>
                        {draft.id
                          ? t('ویرایش مقاله', 'Edit article')
                          : t('یک ایدهٔ تازه.', 'A new idea.')}
                      </h1>
                    </div>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setPreview(!preview)}
                    >
                      {preview ? t('ویرایش', 'Edit') : t('پیش‌نمایش', 'Preview')}
                    </button>
                  </div>
                  <fieldset disabled={busy}>
                    {preview ? (
                      <iframe
                        className="editor-preview"
                        title={t('پیش‌نمایش مقاله', 'Article preview')}
                        sandbox="allow-same-origin"
                        srcDoc={`<!doctype html><html lang="${draft.locale}" dir="${draft.locale === 'fa' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><link rel="stylesheet" href="/journal.css"></head><body><article class="article"><h1>${escapeHtml(draft.title)}</h1><p class="deck">${escapeHtml(draft.excerpt)}</p>${draft.cover ? `<img class="cover" src="${escapeHtml(draft.cover)}" alt="${escapeHtml(draft.coverAlt)}">` : ''}<div class="prose">${renderBody(draft.body)}</div></article></body></html>`}
                      />
                    ) : (
                      <>
                        <label>
                          {t('عنوان مقاله', 'Article title')}
                          <input
                            name="title"
                            value={draft.title}
                            onChange={(e) => update({ title: e.target.value })}
                            maxLength={180}
                            required
                            dir="auto"
                          />
                        </label>
                        <div className="field-pair">
                          <label>
                            {t('زبان مقاله', 'Article language')}
                            <select
                              value={draft.locale}
                              onChange={(e) =>
                                update({
                                  locale: e.target.value as 'fa' | 'en',
                                })
                              }
                            >
                              <option value="fa">فارسی</option>
                              <option value="en">English</option>
                            </select>
                          </label>
                          <label>
                            {t('دسته‌بندی', 'Category')}
                            <input
                              value={draft.category}
                              onChange={(e) => update({ category: e.target.value })}
                              maxLength={60}
                            />
                          </label>
                        </div>
                        <label>
                          {t('نشانی مقاله (با خط تیره)', 'Article URL (hyphens between words)')}
                          <input
                            name="slug"
                            value={draft.slug}
                            onChange={(e) => update({ slug: e.target.value })}
                            required
                            maxLength={140}
                            dir="ltr"
                            placeholder="electrical-design-for-buildings"
                          />
                          <small dir="ltr">
                            /{draft.locale}/journal/
                            {draft.slug || 'your-article'}/
                          </small>
                        </label>
                        <label>
                          {t('خلاصه و توضیح موتور جست‌وجو', 'Summary and search description')}
                          <textarea
                            name="excerpt"
                            value={draft.excerpt}
                            onChange={(e) => update({ excerpt: e.target.value })}
                            maxLength={320}
                            rows={2}
                            required={draft.status === 'published'}
                            dir="auto"
                          />
                        </label>
                        <div className="editor-toolbar">
                          <button type="button" onClick={() => insert('## ')}>
                            {t('عنوان بخش', 'Heading')}
                          </button>
                          <button type="button" onClick={() => insert('- ')}>
                            {t('فهرست', 'List')}
                          </button>
                          <button type="button" onClick={() => setTab('media')}>
                            {t('افزودن عکس / ویدئو', 'Insert image / video')} ＋
                          </button>
                        </div>
                        <label>
                          {t('متن مقاله', 'Article content')}
                          <textarea
                            ref={textArea}
                            name="body"
                            value={draft.body}
                            onChange={(e) => update({ body: e.target.value })}
                            maxLength={60000}
                            rows={13}
                            required={draft.status === 'published'}
                            dir={draft.locale === 'fa' ? 'rtl' : 'ltr'}
                          />
                          <small>
                            {t(
                              'بین بندها یک خط خالی بگذارید. برای عنوان بخش از ## و برای فهرست از - استفاده کنید.',
                              'Separate paragraphs with a blank line. Use ## for headings and - for lists. HTML is displayed as text.',
                            )}
                          </small>
                        </label>
                        <div className="cover-editor">
                          {draft.cover && (
                            <Image
                              unoptimized
                              width={480}
                              height={320}
                              src={draft.cover}
                              alt={draft.coverAlt || t('تصویر انتخاب‌شده', 'Selected cover')}
                            />
                          )}
                          <div>
                            <button
                              className="text-button"
                              type="button"
                              onClick={() => setTab('media')}
                            >
                              {t('انتخاب تصویر جلد', 'Choose cover image')} ＋
                            </button>
                            {draft.cover && (
                              <button
                                className="text-button"
                                type="button"
                                onClick={() => update({ cover: '', coverAlt: '' })}
                              >
                                {t('حذف جلد', 'Remove cover')}
                              </button>
                            )}
                            <label>
                              {t('توضیح تصویر برای دسترس‌پذیری', 'Cover image description')}
                              <input
                                name="coverAlt"
                                value={draft.coverAlt}
                                onChange={(e) => update({ coverAlt: e.target.value })}
                                maxLength={240}
                                required={!!draft.cover && draft.status === 'published'}
                              />
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="publish-bar">
                      <label>
                        {t('وضعیت', 'Visibility')}
                        <select
                          aria-label={t('وضعیت انتشار', 'Publication status')}
                          value={draft.status}
                          onChange={(e) =>
                            update({
                              status: e.target.value as 'draft' | 'published',
                            })
                          }
                        >
                          <option value="draft">{t('پیش‌نویس خصوصی', 'Private draft')}</option>
                          <option value="published">{t('انتشار عمومی', 'Published')}</option>
                        </select>
                      </label>
                      <button className="solid-button" type="submit">
                        {busy ? t('در حال ذخیره…', 'Saving…') : t('ذخیرهٔ مقاله', 'Save article')} ↗
                      </button>
                    </div>
                  </fieldset>
                  <div className="editor-bottom">
                    <span>
                      {dirty
                        ? t('تغییرات ذخیره نشده', 'Unsaved changes')
                        : draft.id
                          ? t('ذخیره‌شده', 'Saved')
                          : ''}
                    </span>
                    {draft.id && (
                      <button
                        type="button"
                        className="danger-button"
                        disabled={busy}
                        onClick={remove}
                      >
                        {t('حذف مقاله', 'Delete article')}
                      </button>
                    )}
                    {draft.id && draft.status === 'published' && !dirty && (
                      <a
                        href={`/${draft.locale}/journal/${encodeURIComponent(draft.slug)}/`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('مشاهدهٔ مقاله', 'View article')} ↗
                      </a>
                    )}
                  </div>
                </form>
              )}
              {tab === 'media' && (
                <section>
                  <div className="admin-title">
                    <div>
                      <span className="chapter-index">MEDIA / ASSETS</span>
                      <h1>{t('کتابخانهٔ رسانه.', 'The media library.')}</h1>
                    </div>
                    <button
                      className="solid-button"
                      disabled={busy}
                      type="button"
                      onClick={() => fileInput.current?.click()}
                    >
                      {busy
                        ? t('در حال بارگذاری…', 'Uploading…')
                        : t('بارگذاری فایل', 'Upload media')}{' '}
                      ＋
                    </button>
                    <input
                      ref={fileInput}
                      type="file"
                      hidden
                      accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,text/vtt,.vtt"
                      onChange={(e) => void upload(e.target.files?.[0])}
                    />
                  </div>
                  <p className="editor-help">
                    {t(
                      'عکس: JPEG، PNG، WebP تا ۸ مگابایت. ویدئو: MP4، WebM تا ۲۰ مگابایت.',
                      'Images: JPEG, PNG, WebP up to 8 MB. Videos: MP4, WebM up to 20 MB. WebVTT captions: up to 512 KB.',
                    )}
                  </p>
                  <div className="media-grid">
                    {media.map((file) => (
                      <article key={file.key}>
                        {file.type.startsWith('image/') ? (
                          <Image
                            unoptimized
                            width={480}
                            height={320}
                            src={`/media/${file.key}`}
                            alt={file.name}
                            loading="lazy"
                          />
                        ) : (
                          <div className="video-placeholder" role="img" aria-label={file.name}>
                            {file.key.endsWith('.vtt') ? 'CC / VTT' : '▷ VIDEO'}
                          </div>
                        )}
                        <p dir="auto">{file.name}</p>
                        <small>{Math.ceil(file.size / 1024)} KB</small>
                        <div>
                          {file.type.startsWith('image/') && (
                            <button
                              type="button"
                              onClick={() => {
                                update({ cover: `/media/${file.key}` });
                                setTab('posts');
                              }}
                            >
                              {t('جلد مقاله', 'Use as cover')}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={file.key.endsWith('.vtt')}
                            onClick={() => {
                              const alt = file.type.startsWith('image/')
                                ? window.prompt(t('توضیح کوتاه تصویر', 'A short image description'))
                                : null;
                              if (file.type.startsWith('image/') && !alt?.trim()) return;
                              insert(
                                file.type.startsWith('image/')
                                  ? `![${alt?.replace(/[\]\n]/g, '')}](/media/${file.key})`
                                  : `@video(/media/${file.key})`,
                              );
                            }}
                          >
                            {t('درج در مقاله', 'Insert in article')}
                          </button>
                          <a href={`/media/${file.key}`} target="_blank" rel="noreferrer">
                            ↗
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                  {!media.length && (
                    <p className="admin-empty">
                      {t(
                        'اولین تصویر یا ویدئوی خود را بارگذاری کنید.',
                        'Upload your first image or video.',
                      )}
                    </p>
                  )}
                </section>
              )}
              {tab === 'inquiries' && (
                <section>
                  <div className="admin-title">
                    <div>
                      <span className="chapter-index">PROJECTS / INBOX</span>
                      <h1>{t('اتصال‌های تازه.', 'New connections.')}</h1>
                    </div>
                    <button
                      type="button"
                      className="text-button"
                      onClick={async () => {
                        try {
                          setInquiries(await api<Inquiry[]>('inquiries'));
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Unable to refresh');
                        }
                      }}
                    >
                      {t('به‌روزرسانی', 'Refresh')} ↻
                    </button>
                  </div>
                  {inquiries.map((item) => (
                    <article className="inquiry" key={item.id}>
                      <div>
                        <h2>{item.name}</h2>
                        <span dir="ltr">
                          {new Date(item.createdAt).toLocaleDateString(language)}
                        </span>
                      </div>
                      <p dir="auto">{item.contact}</p>
                      <small>
                        {[
                          item.type,
                          item.phase,
                          item.services?.join(' · '),
                          item.timeline,
                          item.location,
                        ]
                          .filter(Boolean)
                          .join(' / ')}
                      </small>
                      <p>{item.message}</p>
                    </article>
                  ))}
                  {!inquiries.length && (
                    <p className="admin-empty">
                      {t(
                        'درخواست‌های فرم پروژه در این‌جا نمایش داده می‌شود.',
                        'Project form enquiries will appear here.',
                      )}
                    </p>
                  )}
                </section>
              )}
            </main>
          </div>
        </>
      )}
    </div>
  );
}
