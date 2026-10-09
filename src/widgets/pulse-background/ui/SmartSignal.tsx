'use client';

import { useEffect, useRef, useState } from 'react';
import { useExperience, useExperienceApi } from '@/entities/experience/model/provider';
import { showcase } from '@/shared/config/showcase';

const modes = [
  { fa: 'روشنایی', en: 'Lighting', code: '01', icon: 'light' },
  { fa: 'حفاظت', en: 'Protection', code: '02', icon: 'shield' },
  { fa: 'هوشمندسازی', en: 'Automation', code: '03', icon: 'control' },
] as const;

export function SmartSignal() {
  const store = useExperienceApi();
  const locale = useExperience((s) => s.locale);
  const powered = useExperience((s) => s.powered);
  const paused = useExperience((s) => s.motionPaused);
  const reduced = useExperience((s) => s.reducedMotion);
  const mode = useExperience((s) => s.signalMode);
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let intersecting = false;
    const sync = () => setVisible(intersecting && document.visibilityState === 'visible');
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      sync();
    });
    if (root.current) observer.observe(root.current);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  const fa = locale === 'fa';
  const copy = showcase[locale];
  return (
    <div
      className="smart-signal"
      ref={root}
      data-powered={powered}
      data-mode={mode}
      data-animate={visible && powered && !paused && !reduced}
    >
      <div className="signal-registration" aria-hidden="true" dir="ltr">
        <span>INTELLIGENCE / IN THE CURRENT</span>
        <span>↗</span>
      </div>
      <button
        className="signal-lens"
        type="button"
        role="switch"
        aria-checked={powered}
        aria-label={powered ? copy.powerOff : copy.powerOn}
        onClick={() => store.getState().setPowered(!store.getState().powered)}
      >
        <svg viewBox="0 0 400 400" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="signal-face" cx="38%" cy="28%" r="78%">
              <stop offset="0" stopColor="#34352b" />
              <stop offset="0.6" stopColor="#1d1e19" />
              <stop offset="1" stopColor="#111210" />
            </radialGradient>
            <linearGradient id="signal-rim" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#a3a18b" stopOpacity="0.65" />
              <stop offset="0.45" stopColor="#363831" />
              <stop offset="1" stopColor="#8c8d6b" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          <circle className="lens-boundary" cx="200" cy="200" r="185" />
          <g className="lens-orbit">
            <circle cx="200" cy="200" r="168" strokeDasharray="1 12" />
            <circle cx="200" cy="200" r="159" strokeDasharray="85 20 1 30" />
            <path d="M200 15v15M200 370v15M15 200h15M370 200h15" />
          </g>
          <g className="lens-counter-orbit">
            <circle cx="200" cy="200" r="147" strokeDasharray="38 145 10 52" />
            <circle className="lens-satellite" cx="200" cy="53" r="4" />
          </g>
          <circle className="lens-inner" cx="200" cy="200" r="138" />
          <g className="lens-wave">
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                d={`M67 ${200 + (i - 2) * 9} C110 ${115 + i * 14} 145 ${285 - i * 6} 200 ${200 + (i - 2) * 9} S285 ${115 + i * 14} 333 ${200 + (i - 2) * 9}`}
              />
            ))}
          </g>
          <circle className="lens-ripple ripple-one" cx="200" cy="200" r="87" />
          <circle className="lens-ripple ripple-two" cx="200" cy="200" r="87" />
          <circle className="lens-node" cx="200" cy="62" r="3" />
          <circle className="lens-node" cx="62" cy="200" r="3" />
          <circle className="lens-node" cx="338" cy="200" r="3" />
          <circle className="lens-core-rim" cx="200" cy="200" r="68" />
          <circle className="lens-core" cx="200" cy="200" r="59" />
          <g className="lens-core-dial">
            <circle cx="200" cy="200" r="48" strokeDasharray="65 14 4 18" />
          </g>
          <g className="lens-icon icon-power" data-active={!powered || mode === 0}>
            <g className="power-rotor">
              <path d="M200 172v28M184 181a25 25 0 1 0 32 0" />
            </g>
          </g>
          <g className="lens-icon icon-protection" data-active={powered && mode === 1}>
            <path d="m200 171 23 9v20c0 17-11 25-23 31-12-6-23-14-23-31v-20z" />
            <path className="shield-check" d="m188 199 8 8 17-18" />
          </g>
          <g className="lens-icon icon-automation" data-active={powered && mode === 2}>
            <rect x="181" y="181" width="38" height="38" rx="8" />
            <rect x="193" y="193" width="14" height="14" rx="3" />
            <path d="M190 172v9m10-9v9m10-9v9m-20 38v9m10-9v9m10-9v9m-38-38h9m-9 10h9m-9 10h9m38-20h9m-9 10h9m-9 10h9" />
          </g>
        </svg>
        <span className="signal-state" dir="ltr" aria-hidden="true">
          {powered ? `LIVE / ${modes[mode].code}` : 'STANDBY / 00'}
        </span>
      </button>
      <fieldset className="signal-modes">
        <legend className="sr-only">
          {fa ? 'جریان هوشمند را تجربه کنید' : 'Explore smart current'}
        </legend>
        {modes.map((item, index) => (
          <button
            type="button"
            key={item.code}
            aria-pressed={powered && mode === index}
            onClick={() => store.getState().setSignalMode(index as 0 | 1 | 2)}
          >
            <span dir="ltr" aria-hidden="true">
              {item.code}
            </span>
            {fa ? item.fa : item.en}
          </button>
        ))}
      </fieldset>
      <p className="signal-hint">
        {fa ? 'دایره را بزنید. جریان را ببینید.' : 'Touch the circle. See the current.'}
      </p>
    </div>
  );
}
