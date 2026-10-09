'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useExperience, useExperienceApi } from '@/entities/experience/model/provider';
import { showcase } from '@/shared/config/showcase';

const PulseCanvas = dynamic(() => import('./PulseCanvas'), { ssr: false });

export function PulseBackground() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const failure = useCallback(() => setFailed(true), []);
  const loaded = useCallback(() => setReady(true), []);
  const powered = useExperience((s) => s.powered);
  useEffect(() => {
    let visible = true;
    const sync = () => setActive(visible && document.visibilityState === 'visible');
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.03 },
    );
    if (root.current) observer.observe(root.current);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  return (
    <div
      className="pulse-background"
      ref={root}
      aria-hidden="true"
      data-powered={powered}
      data-ready={ready && !failed}
    >
      <div className="pulse-fallback">
        <span />
        <span />
        <span />
      </div>
      {!failed && <PulseCanvas active={active} onFailure={failure} onReady={loaded} />}
    </div>
  );
}

export function CurrentControl() {
  const store = useExperienceApi();
  const powered = useExperience((s) => s.powered);
  const paused = useExperience((s) => s.motionPaused);
  const locale = useExperience((s) => s.locale);
  const copy = showcase[locale];
  return (
    <div className="current-controls" data-powered={powered}>
      <button
        className="current-switch"
        type="button"
        role="switch"
        aria-label={powered ? copy.powerOff : copy.powerOn}
        aria-checked={powered}
        onClick={() => store.getState().setPowered(!store.getState().powered)}
      >
        <span className="current-switch-icon" aria-hidden="true">
          <svg
            aria-hidden="true"
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M16 3v13M9 7a11 11 0 1 0 14 0" />
          </svg>
        </span>
        <span>
          <small>{powered ? copy.live : 'BARGHINO / CURRENT'}</small>
          <strong>{powered ? copy.powerOff : copy.powerHint}</strong>
        </span>
        <span className="switch-state" aria-hidden="true">
          {powered ? 'I' : 'O'}
        </span>
      </button>
      <button
        className="motion-toggle"
        type="button"
        aria-pressed={paused}
        onClick={() => store.getState().setMotionPaused(!paused)}
      >
        {paused ? copy.resume : copy.pause}
        <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span>
      </button>
    </div>
  );
}
