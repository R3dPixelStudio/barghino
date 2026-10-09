'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useExperience } from '@/entities/experience/model/provider';
import { conceptGallery, showcase, type GalleryItem } from '@/shared/config/showcase';
import type { Locale } from '@/shared/config/locale';

function distance(index: number, selected: number, count: number) {
  const raw = index - selected;
  return raw > count / 2 ? raw - count : raw < -count / 2 ? raw + count : raw;
}

function WorkMedia({
  item,
  active,
  full = false,
  locale,
}: {
  item: GalleryItem;
  active: boolean;
  full?: boolean;
  locale: Locale;
}) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!active || !full) element?.pause();
    else element?.focus({ preventScroll: true });
    return () => element?.pause();
  }, [active, full]);
  if (item.kind === 'video' && active && full)
    return (
      // biome-ignore lint/a11y/useMediaCaption: Silent films use their authored description; films with speech support uploaded WebVTT captions.
      <video
        ref={video}
        src={item.src}
        poster={item.poster || undefined}
        controls
        tabIndex={0}
        playsInline
        preload="metadata"
        aria-label={locale === 'fa' ? item.titleFa : item.titleEn}
      >
        {item.captions && (
          <track
            kind="captions"
            src={item.captions}
            srcLang={item.captionLanguage ?? 'fa'}
            label={item.captionLanguage === 'en' ? 'English' : 'فارسی'}
            default
          />
        )}
      </video>
    );
  return item.kind === 'image' || item.poster ? (
    <Image
      unoptimized
      src={item.kind === 'image' ? item.src : item.poster}
      alt={locale === 'fa' ? item.altFa : item.altEn}
      width={1200}
      height={900}
      loading={active ? 'eager' : 'lazy'}
      draggable={false}
    />
  ) : (
    <div className="gallery-video-cover">
      <svg aria-hidden="true" viewBox="0 0 40 40" fill="none" stroke="currentColor">
        <rect x="3" y="8" width="34" height="24" />
        <path d="m17 14 9 6-9 6Z" />
      </svg>
      <span>FILM / {item.titleEn}</span>
    </div>
  );
}

export function WorkGallery({ locale }: { locale: Locale }) {
  const paused = useExperience((s) => s.motionPaused);
  const reduced = useExperience((s) => s.reducedMotion);
  const [items, setItems] = useState<GalleryItem[]>(conceptGallery);
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef(false);
  const drag = useRef<{ x: number; y: number; dragged: boolean } | null>(null);
  const copy = showcase[locale];
  const fa = locale === 'fa';
  const current = items[selected] ?? items[0];
  const choose = useCallback(
    (index: number) => {
      setSelected((index + items.length) % items.length);
      setExpanded(false);
    },
    [items.length],
  );
  const collapse = useCallback(() => {
    restoreFocus.current = true;
    setExpanded(false);
  }, []);
  useEffect(() => {
    if (!expanded && restoreFocus.current) {
      root.current
        ?.querySelector<HTMLButtonElement>('[data-active="true"] .gallery-trigger')
        ?.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
    if (!expanded) return;
    const onEscape = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !document.fullscreenElement &&
        event.target instanceof Node &&
        root.current?.contains(event.target)
      )
        collapse();
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [expanded, collapse]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/portfolio', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Unavailable');
        return response.json();
      })
      .then((published: GalleryItem[]) => {
        if (!controller.signal.aborted && published.length) {
          setItems(published);
          setSelected(0);
          setExpanded(false);
        }
      })
      .catch(() => {
        /* The labeled concept gallery remains usable if content is unavailable. */
      });
    return () => controller.abort();
  }, []);
  if (!current) return null;
  return (
    <div
      className="work-gallery"
      ref={root}
      data-selected={selected}
      data-expanded={expanded}
      data-motion={paused || reduced ? 'still' : 'full'}
    >
      <section
        className="gallery-viewport"
        aria-roledescription="carousel"
        aria-label={fa ? 'گالری کارنامه و پروژه‌ها' : 'Selected work gallery'}
        onPointerDown={(event) => {
          if ((event.target as Element).closest('video')) {
            drag.current = null;
            return;
          }
          if (event.button === 0)
            drag.current = {
              x: event.clientX,
              y: event.clientY,
              dragged: false,
            };
        }}
        onPointerMove={(event) => {
          const state = drag.current;
          if (state && Math.abs(event.clientX - state.x) > 12) state.dragged = true;
        }}
        onPointerUp={(event) => {
          const state = drag.current;
          if (!state) return;
          const deltaX = event.clientX - state.x;
          const deltaY = event.clientY - state.y;
          if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY))
            choose(selected + (deltaX * (fa ? -1 : 1) < 0 ? 1 : -1));
          drag.current = state.dragged ? state : null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {items.map((item, index) => {
          const offset = distance(index, selected, items.length);
          const active = offset === 0;
          return (
            <div
              className="gallery-slide"
              key={item.id}
              data-active={active}
              data-expanded={active && expanded}
              style={
                {
                  '--offset': offset * (fa ? -1 : 1),
                  '--depth': Math.abs(offset),
                  zIndex: 10 - Math.abs(offset),
                  visibility: Math.abs(offset) > 3 ? 'hidden' : 'visible',
                } as React.CSSProperties
              }
            >
              <WorkMedia item={item} active={active} full={active && expanded} locale={locale} />
              <button
                className="gallery-trigger"
                type="button"
                aria-pressed={active}
                aria-expanded={active && expanded}
                aria-controls={active ? 'work-details' : undefined}
                aria-label={`${fa ? item.titleFa : item.titleEn} — ${active && expanded ? (fa ? 'بازگشت به گالری' : 'Back to gallery') : copy.open}`}
                tabIndex={Math.abs(offset) < 3 ? 0 : -1}
                hidden={active && expanded && item.kind === 'video'}
                onClick={() => {
                  if (drag.current?.dragged) {
                    drag.current = null;
                    return;
                  }
                  if (!active) {
                    choose(index);
                    setExpanded(true);
                  } else if (expanded) collapse();
                  else setExpanded(true);
                }}
              />
              <span className="slide-corner" aria-hidden="true">
                {active && expanded ? '−' : item.kind === 'video' ? '▷' : '＋'}
              </span>
              <span className="slide-number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              {item.concept && (
                <span className="concept-chip">{fa ? 'پیش‌نمایش مفهومی' : 'CONCEPT PREVIEW'}</span>
              )}
            </div>
          );
        })}
      </section>
      <div className="gallery-caption">
        <div aria-live="polite" aria-atomic="true">
          <span className="eyebrow">{fa ? current.categoryFa : current.categoryEn}</span>
          <h3 id="work-caption-title">{fa ? current.titleFa : current.titleEn}</h3>
          <p>
            {current.location}
            {current.year ? ` / ${current.year}` : ''}
          </p>
        </div>
        <div className="gallery-controls">
          {expanded && (
            <button
              className="gallery-collapse"
              type="button"
              aria-label={fa ? 'بازگشت به گالری' : 'Back to gallery'}
              onClick={collapse}
            >
              <span aria-hidden="true">−</span>
            </button>
          )}
          <span className="gallery-position" dir="ltr">
            {String(selected + 1).padStart(2, '0')}
            <i />
            {String(items.length).padStart(2, '0')}
          </span>
          <button type="button" aria-label={copy.previous} onClick={() => choose(selected - 1)}>
            <span aria-hidden="true">{fa ? '→' : '←'}</span>
          </button>
          <button type="button" aria-label={copy.next} onClick={() => choose(selected + 1)}>
            <span aria-hidden="true">{fa ? '←' : '→'}</span>
          </button>
        </div>
      </div>
      <section
        id="work-details"
        className="gallery-details"
        aria-labelledby="work-caption-title"
        aria-hidden={!expanded}
        inert={!expanded}
      >
        <div>
          <p>{fa ? current.descriptionFa : current.descriptionEn}</p>
        </div>
      </section>
      {items.every((item) => item.concept) && (
        <p className="gallery-preview-note">{copy.previewNote}</p>
      )}
    </div>
  );
}
