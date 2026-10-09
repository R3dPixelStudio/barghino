'use client';

import { useExperience, useExperienceApi } from '@/entities/experience/model/provider';
import type { Locale } from '@/shared/config/locale';

export function PowerSwitch({ locale }: { locale: Locale }) {
  const powered = useExperience((state) => state.powered);
  const store = useExperienceApi();
  const fa = locale === 'fa';
  return (
    <div className="main-breaker">
      <span className="screw screw-tl" aria-hidden="true" />
      <span className="screw screw-tr" aria-hidden="true" />
      <div className="breaker-brand" dir="ltr">
        BARGHINO <span>MAIN SWITCH</span>
      </div>
      <div className="breaker-spec" dir="ltr">
        <span>QF—01</span>
        <span>3P / SYSTEM</span>
      </div>
      <div className="breaker-assembly">
        <div className="breaker-scale" aria-hidden="true">
          <span>I</span>
          <span>O</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={powered}
          aria-label={fa ? 'کلید برق سایت' : 'Website power'}
          aria-describedby="power-help"
          className="power-rocker"
          onClick={() => store.getState().setPowered(!store.getState().powered)}
        >
          <span className="rocker-face">
            <span className="rocker-mark" aria-hidden="true">
              I
            </span>
            <span className="rocker-grip" />
            <span className="rocker-mark" aria-hidden="true">
              O
            </span>
          </span>
        </button>
        <div className="breaker-lamp" aria-hidden="true">
          <span />
          <small>{powered ? 'ON' : 'OFF'}</small>
        </div>
      </div>
      <div className="breaker-nameplate">
        <span className="breaker-led" />
        <span>{fa ? 'کلید اصلی' : 'MAIN POWER'}</span>
        <span dir="ltr">01</span>
      </div>
      <span className="screw screw-bl" aria-hidden="true" />
      <span className="screw screw-br" aria-hidden="true" />
      <p className="power-instruction" id="power-help">
        {fa ? 'کلید را بزنید. جریان را ببینید.' : 'Flip the switch. See the connection.'}
      </p>
      <span className="switch-status sr-only" role="status">
        {powered
          ? fa
            ? 'برق سایت روشن است'
            : 'Website power is on'
          : fa
            ? 'برق سایت خاموش است؛ محتوا در دسترس است'
            : 'Website power is off. Content remains available.'}
      </span>
    </div>
  );
}
