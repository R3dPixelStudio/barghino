'use client';

import { useEffect, useRef, useState } from 'react';
import { useExperience, useExperienceApi } from '@/entities/experience/model/provider';

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
      <div className="signal-lens" aria-hidden="true">
        <svg viewBox="0 0 400 400" fill="none" aria-hidden="true">
          <circle className="lens-boundary" cx="200" cy="200" r="185" />
          <g className="lens-orbit">
            <circle cx="200" cy="200" r="168" strokeDasharray="1 12" />
            <circle cx="200" cy="200" r="159" strokeDasharray="85 20 1 30" />
            <path d="M200 15v15M200 370v15M15 200h15M370 200h15" />
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
          <circle className="lens-core" cx="200" cy="200" r="53" />
          <path className="lens-bolt" d="m207 170-26 34h19l-7 25 27-35h-20z" />
        </svg>
        <span className="signal-state" dir="ltr">
          {powered ? `LIVE / ${modes[mode].code}` : 'STANDBY / 00'}
        </span>
      </div>
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
        {fa ? 'یک مدار را انتخاب کنید. جریان را حس کنید.' : 'Choose a circuit. Feel the current.'}
      </p>
    </div>
  );
}
