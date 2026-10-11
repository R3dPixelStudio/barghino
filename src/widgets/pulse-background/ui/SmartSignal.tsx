'use client';

import { useExperience, useExperienceApi } from '@/entities/experience/model/provider';
import { showcase } from '@/shared/config/showcase';

const modes = [
  {
    fa: 'تأسیسات برق',
    en: 'Infrastructure',
    code: '01',
    labelFa: 'برق، از منبع تا آخرین مدار.',
    labelEn: 'Power, from source to every circuit.',
  },
  {
    fa: 'حفاظت',
    en: 'Protection',
    code: '02',
    labelFa: 'حفاظت، در تمام مسیر.',
    labelEn: 'Protection throughout the system.',
  },
  {
    fa: 'هوشمندسازی',
    en: 'Automation',
    code: '03',
    labelFa: 'کنترل، در یک سیستم هماهنگ.',
    labelEn: 'Control, working in concert.',
  },
] as const;

export function SmartSignal() {
  const store = useExperienceApi();
  const locale = useExperience((s) => s.locale);
  const powered = useExperience((s) => s.powered);
  const mode = useExperience((s) => s.signalMode);
  const fa = locale === 'fa';
  const copy = showcase[locale];
  return (
    <div className="smart-signal" data-powered={powered} data-mode={mode}>
      <div className="signal-registration" dir="ltr">
        <span>THE INTEGRATED SYSTEM</span>
        <span className="system-live">
          <i />
          {powered ? 'CONNECTED' : 'ISOLATED'}
        </span>
      </div>
      <div className="system-stage" id="system-core">
        <svg className="system-fallback" viewBox="0 0 620 480" fill="none" aria-hidden="true">
          <g transform="translate(310 240) rotate(-9)">
            <rect
              x="-251"
              y="-165"
              width="502"
              height="350"
              rx="18"
              fill="#252a2a"
              stroke="#626964"
            />
            <rect
              x="-251"
              y="-182"
              width="502"
              height="350"
              rx="18"
              fill="#171c1d"
              stroke="#59615a"
            />
            <path d="M-65-20h-60l-65-65h-45M-65-5h-75l-60-60h-35M0 65v35l60 60h130M18 65v25l50 50h122M65-15h60l70-70h40M65 0h70l60-60h40" />
            <circle r="83" fill="#343a37" stroke="#868c79" />
            <circle r="67" fill="#171c1d" stroke="#f7db0560" />
          </g>
        </svg>
        <span className="system-index" dir="ltr" aria-hidden="true">
          01 / 02 / 03
        </span>
        <button
          className="signal-lens"
          type="button"
          role="switch"
          aria-checked={powered}
          aria-label={powered ? copy.powerOff : copy.powerOn}
          aria-describedby="system-purpose"
          onClick={() => store.getState().setPowered(!store.getState().powered)}
        >
          <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <g className="lens-icon icon-power" data-active={!powered || mode === 0}>
              <path d="M50 28v24M36 35a23 23 0 1 0 28 0" />
            </g>
            <g className="lens-icon icon-protection" data-active={powered && mode === 1}>
              <path d="m50 25 22 9v19c0 16-11 23-22 29-11-6-22-13-22-29V34z" />
              <path d="m39 51 8 8 15-17" />
            </g>
            <g className="lens-icon icon-automation" data-active={powered && mode === 2}>
              <rect x="33" y="33" width="34" height="34" rx="6" />
              <rect x="44" y="44" width="12" height="12" rx="2" />
              <path d="M41 24v9m9-9v9m9-9v9m-18 34v9m9-9v9m9-9v9m-35-35h9m-9 9h9m-9 9h9m34-18h9m-9 9h9m-9 9h9" />
            </g>
          </svg>
        </button>
        <div className="system-axis" aria-hidden="true">
          <span />
          <span />
        </div>
      </div>
      <fieldset className="signal-modes">
        <legend className="sr-only">
          {fa ? 'مسیرهای یک سیستم یکپارچه' : 'Explore the integrated system'}
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
      <div className="signal-story" aria-live="polite" aria-atomic="true">
        <p>
          {powered
            ? fa
              ? modes[mode].labelFa
              : modes[mode].labelEn
            : fa
              ? 'جریان قطع است. برای اتصال، مرکز را لمس کنید.'
              : 'System isolated. Touch the core to reconnect.'}
        </p>
      </div>
      <p id="system-purpose" className="signal-hint">
        {fa
          ? 'یک مرکز. سه تخصص. یک سیستم هماهنگ.'
          : 'One core. Three disciplines. One coordinated system.'}
      </p>
    </div>
  );
}
