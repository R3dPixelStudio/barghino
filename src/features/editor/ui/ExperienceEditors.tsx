'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { AssistantSettings, GalleryItem, Media } from '../../../../server/types';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to save');
  return data;
}
function useUnsaved(dirty: boolean) {
  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => event.preventDefault();
    if (dirty) window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty]);
}
type WorkDraft = Omit<GalleryItem, 'id' | 'revision'> & {
  id?: string;
  revision?: string;
};
const blank = (): WorkDraft => ({
  titleFa: '',
  titleEn: '',
  categoryFa: '',
  categoryEn: '',
  src: '',
  kind: 'image',
  poster: '',
  altFa: '',
  altEn: '',
  year: '',
  location: '',
  descriptionFa: '',
  descriptionEn: '',
  status: 'draft',
  order: 0,
  concept: false,
  captions: '',
  captionLanguage: 'fa',
});
export function PortfolioEditor({ media, fa }: { media: Media[]; fa: boolean }) {
  const t = (a: string, b: string) => (fa ? a : b);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [draft, setDraft] = useState<WorkDraft>(blank);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useUnsaved(dirty);
  useEffect(() => {
    const controller = new AbortController();
    api<GalleryItem[]>('portfolio', { signal: controller.signal })
      .then(setItems)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, []);
  function update(change: Partial<WorkDraft>) {
    setDraft((current) => ({ ...current, ...change }));
    setDirty(true);
    setNotice('');
  }
  function select(item?: GalleryItem) {
    if (
      dirty &&
      !window.confirm(t('تغییرات ذخیره نشده را کنار بگذارید؟', 'Discard unsaved changes?'))
    )
      return;
    setDraft(item ?? { ...blank(), order: items.length });
    setDirty(false);
    setNotice('');
    setError('');
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const saved = await api<GalleryItem>('portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      setDraft(saved);
      setItems((current) =>
        [...current.filter((item) => item.id !== saved.id), saved].sort(
          (a, b) => a.order - b.order,
        ),
      );
      setDirty(false);
      setNotice(t('گالری ذخیره شد.', 'Gallery item saved.'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function remove() {
    if (
      !draft.id ||
      lock.current ||
      !window.confirm(t('این مورد از گالری حذف شود؟', 'Delete this gallery item?'))
    )
      return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await api(`portfolio/${draft.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: draft.revision }),
      });
      setItems((current) => current.filter((item) => item.id !== draft.id));
      setDraft(blank());
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const fields = [
    ['titleFa', 'عنوان فارسی', 'Persian title', 140],
    ['titleEn', 'عنوان انگلیسی', 'English title', 140],
    ['categoryFa', 'دسته‌بندی فارسی', 'Persian category', 80],
    ['categoryEn', 'دسته‌بندی انگلیسی', 'English category', 80],
    ['altFa', 'توضیح تصویر فارسی', 'Persian image description', 240],
    ['altEn', 'توضیح تصویر انگلیسی', 'English image description', 240],
    ['year', 'سال', 'Year', 20],
    ['location', 'محل پروژه', 'Project location', 120],
  ] as const;
  return (
    <section>
      <div className="admin-title">
        <div>
          <span className="chapter-index" dir="ltr">
            PORTFOLIO / SELECTED WORK
          </span>
          <h1>{t('کارنامهٔ شما.', 'Your selected work.')}</h1>
        </div>
        <button type="button" className="solid-button" onClick={() => select()} disabled={busy}>
          {t('مورد تازه', 'New gallery item')} ＋
        </button>
      </div>
      <p className="editor-help">
        {t(
          'ابتدا فایل را در رسانه‌ها بارگذاری کنید، سپس این‌جا انتخاب کنید. با انتشار اولین مورد، پیش‌نمایش‌های مفهومی جای خود را به کار واقعی می‌دهند. برای ویدئو، پوستر و توضیح محتوای فیلم را اضافه کنید.',
          'Upload files in the media library, then select them here. Your first published item replaces the concept previews. For videos, add a poster and a description of the film.',
        )}
      </p>
      <div className="portfolio-list">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            disabled={busy}
            aria-pressed={item.id === draft.id}
            onClick={() => select(item)}
          >
            <small>
              {item.order} / {item.status}
            </small>
            {fa ? item.titleFa : item.titleEn}
          </button>
        ))}
      </div>
      {error && (
        <p className="admin-notice error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}
      <form className="editor-form" onSubmit={save}>
        <fieldset disabled={busy}>
          <label>
            {t('عکس یا ویدئو', 'Image or video')}
            <select
              required
              value={draft.src}
              onChange={(event) =>
                update({
                  src: event.target.value,
                  kind: /\.(mp4|webm)$/.test(event.target.value) ? 'video' : 'image',
                })
              }
            >
              <option value="">{t('انتخاب رسانه', 'Select uploaded media')}</option>
              {media
                .filter((file) => !file.key.endsWith('.vtt'))
                .map((file) => (
                  <option key={file.key} value={`/media/${file.key}`}>
                    {file.name}
                  </option>
                ))}
            </select>
          </label>
          {draft.kind === 'video' && (
            <label>
              {t('پوستر ویدئو', 'Video poster')}
              <select
                value={draft.poster}
                onChange={(event) => update({ poster: event.target.value })}
              >
                <option value="">{t('بدون پوستر', 'No poster')}</option>
                {media
                  .filter((file) => file.type.startsWith('image/'))
                  .map((file) => (
                    <option key={file.key} value={`/media/${file.key}`}>
                      {file.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {draft.kind === 'video' && (
            <label>
              {t('زیرنویس WebVTT', 'WebVTT captions')}
              <select
                value={draft.captions || ''}
                onChange={(event) => update({ captions: event.target.value })}
              >
                <option value="">
                  {t('بدون زیرنویس (فیلم بدون گفتار)', 'No captions (silent film)')}
                </option>
                {media
                  .filter((file) => file.key.endsWith('.vtt'))
                  .map((file) => (
                    <option key={file.key} value={`/media/${file.key}`}>
                      {file.name}
                    </option>
                  ))}
              </select>
              <small>
                {t(
                  'برای فیلم دارای گفتار، زیرنویس بارگذاری کنید و زبان آن را مشخص کنید.',
                  'For films with speech, upload captions and select their actual language.',
                )}
              </small>
            </label>
          )}
          {draft.kind === 'video' && (
            <label>
              {t('زبان زیرنویس', 'Caption language')}
              <select
                value={draft.captionLanguage ?? 'fa'}
                onChange={(event) => update({ captionLanguage: event.target.value as 'fa' | 'en' })}
              >
                <option value="fa">فارسی</option>
                <option value="en">English</option>
              </select>
            </label>
          )}
          <div className="portfolio-fields">
            {fields.map(([key, persian, english, max]) => (
              <label key={key}>
                {t(persian, english)}
                <input
                  name={key}
                  value={draft[key]}
                  dir={key.endsWith('Fa') ? 'rtl' : 'auto'}
                  maxLength={max}
                  required={
                    key.startsWith('title') || (key.startsWith('alt') && draft.kind === 'image')
                  }
                  onChange={(event) => update({ [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
          <label>
            {t('شرح فارسی پروژه / محتوای فیلم', 'Persian project / film description')}
            <textarea
              value={draft.descriptionFa}
              dir="rtl"
              rows={3}
              maxLength={1500}
              onChange={(event) => update({ descriptionFa: event.target.value })}
            />
          </label>
          <label>
            {t('شرح انگلیسی پروژه / محتوای فیلم', 'English project / film description')}
            <textarea
              value={draft.descriptionEn}
              dir="ltr"
              rows={3}
              maxLength={1500}
              onChange={(event) => update({ descriptionEn: event.target.value })}
            />
          </label>
          <div className="field-pair">
            <label>
              {t('ترتیب نمایش', 'Display order')}
              <input
                type="number"
                value={draft.order}
                min={0}
                max={10000}
                onChange={(event) => update({ order: Number(event.target.value) })}
              />
            </label>
            <label>
              {t('وضعیت گالری', 'Gallery visibility')}
              <select
                value={draft.status}
                onChange={(event) =>
                  update({
                    status: event.target.value as 'draft' | 'published',
                  })
                }
              >
                <option value="draft">{t('پیش‌نویس', 'Draft')}</option>
                <option value="published">{t('انتشار', 'Published')}</option>
              </select>
            </label>
          </div>
          <button className="solid-button" type="submit">
            {t('ذخیرهٔ گالری', 'Save gallery item')} ↗
          </button>
        </fieldset>
      </form>
      <div className="editor-bottom">
        <span>{dirty ? t('تغییرات ذخیره نشده', 'Unsaved changes') : ''}</span>
        {draft.id && (
          <button
            className="danger-button"
            type="button"
            disabled={busy}
            onClick={() => void remove()}
          >
            {t('حذف از گالری', 'Delete gallery item')}
          </button>
        )}
      </div>
    </section>
  );
}

export function AssistantEditor({ fa }: { fa: boolean }) {
  const t = (a: string, b: string) => (fa ? a : b);
  const [settings, setSettings] = useState<AssistantSettings | null>(null);
  const [configured, setConfigured] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useUnsaved(dirty);
  useEffect(() => {
    const controller = new AbortController();
    api<{ settings: AssistantSettings; configured: boolean }>('assistant', {
      signal: controller.signal,
    })
      .then((data) => {
        setSettings(data.settings);
        setConfigured(data.configured);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, []);
  function update(change: Partial<AssistantSettings>) {
    setSettings((current) => (current ? { ...current, ...change } : null));
    setDirty(true);
    setNotice('');
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      setSettings(
        await api<AssistantSettings>('assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        }),
      );
      setDirty(false);
      setNotice(t('تنظیمات دستیار ذخیره شد.', 'Assistant settings saved.'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="admin-title">
        <div>
          <span className="chapter-index" dir="ltr">
            AI / GROQ
          </span>
          <h1>{t('صدای برند شما.', 'Your brand’s voice.')}</h1>
        </div>
      </div>
      <p className="editor-help">
        {configured
          ? t('کلید Groq روی سرور تنظیم شده است.', 'Groq is configured on the server.')
          : t(
              'برای اتصال، GROQ_API_KEY را در Secrets سرویس Cloudflare قرار دهید. کلید را در این فرم یا اطلاعات دانش وارد نکنید.',
              'Connect by adding GROQ_API_KEY to your Cloudflare Worker secrets. Do not put the key in this form or knowledge text.',
            )}
      </p>
      {error && (
        <p className="admin-notice error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}
      {settings && (
        <form className="editor-form" onSubmit={save}>
          <fieldset disabled={busy}>
            <label>
              {t('شخصیت و لحن دستیار', 'Assistant persona and tone')}
              <textarea
                rows={7}
                maxLength={12000}
                required
                dir="auto"
                value={settings.persona}
                onChange={(event) => update({ persona: event.target.value })}
              />
            </label>
            <label>
              {t(
                'اطلاعات تأییدشدهٔ شرکت، روش کار و پرسش‌های متداول',
                'Confirmed company information, process and FAQs',
              )}
              <textarea
                rows={12}
                maxLength={30000}
                dir="auto"
                value={settings.knowledge}
                onChange={(event) => update({ knowledge: event.target.value })}
              />
            </label>
            <label>
              {t('مدل Groq', 'Groq model')}
              <input
                value={settings.model}
                dir="ltr"
                maxLength={120}
                required
                onChange={(event) => update({ model: event.target.value })}
              />
            </label>
            <label>
              {t('وضعیت دستیار', 'Assistant visibility')}
              <select
                value={settings.enabled ? 'on' : 'off'}
                onChange={(event) => update({ enabled: event.target.value === 'on' })}
              >
                <option value="on">{t('فعال', 'Enabled')}</option>
                <option value="off">{t('غیرفعال', 'Disabled')}</option>
              </select>
            </label>
            <button className="solid-button" type="submit">
              {t('ذخیرهٔ تنظیمات دستیار', 'Save assistant settings')} ↗
            </button>
          </fieldset>
        </form>
      )}
    </section>
  );
}
