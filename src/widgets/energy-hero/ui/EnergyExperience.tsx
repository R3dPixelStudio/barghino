'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useExperience, useExperienceApi } from '@/entities/experience/model/provider';
import type { SiteContent } from '@/shared/config/content';
import { PowerSwitch } from '@/features/power/ui/PowerSwitch';
import { BuildingCircuit } from '@/shared/ui/BuildingCircuit';

const CabinetInspector = dynamic(() => import('./CabinetInspector'), {
  ssr: false,
  loading: () => (
    <div className="inspector-loading">
      <BuildingCircuit />
      <span>3D…</span>
    </div>
  ),
});

export function EnergyExperience({ copy }: { copy: SiteContent }) {
  const locale = useExperience((state) => state.locale);
  const powered = useExperience((state) => state.powered);
  const reduced = useExperience((state) => state.reducedMotion);
  const paused = useExperience((state) => state.motionPaused);
  const store = useExperienceApi();
  const root = useRef<HTMLDivElement>(null);
  const [inspect, setInspect] = useState(false);
  const [visible, setVisible] = useState(true);
  const fa = locale === 'fa';

  useEffect(() => {
    if (!root.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.05,
    });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="energy-visual" ref={root} data-visible={visible} data-testid="energy-visual">
      <div className="panel-heading">
        <span className="panel-label">
          {fa ? 'از یک ساختمان تا یک مجموعه' : 'ONE BUILDING. AN ENTIRE DEVELOPMENT.'}
        </span>
        <span dir="ltr" className="mono">
          BG / 01
        </span>
      </div>
      <div className="energy-stage">
        <div className="blueprint-grid" aria-hidden="true" />
        <div className="building-plate">
          <BuildingCircuit />
        </div>
        <svg className="feeder-cables" viewBox="0 0 620 470" fill="none" aria-hidden="true">
          <path className="cable-shadow" d="M138 301v69q0 30 30 30h46q15 0 15 15h13" />
          <path className="cable-body" d="M138 301v69q0 30 30 30h46q15 0 15 15h13" />
          <path className="cable-current" d="M138 301v69q0 30 30 30h46q15 0 15 15h13" />
          <path className="cable-earth" d="M119 305v70q0 47 47 47h33" />
        </svg>
        <PowerSwitch locale={locale} />
        <p className="stage-reference mono" dir="ltr">
          POWER DISTRIBUTION
          <br />
          <span>SCHEMATIC / CONCEPT</span>
        </p>
        {inspect && (
          <div className="inspector-panel" id="cabinet-inspector">
            <CabinetInspector powered={powered} active={visible} />
            <button
              className="close-inspector"
              type="button"
              onClick={() => setInspect(false)}
              aria-label={fa ? 'بستن نمای سه‌بعدی' : 'Close 3D inspection'}
            >
              ×
            </button>
          </div>
        )}
      </div>
      <div className="visual-controls">
        <span className="power-readout">
          <span className="status-dot" />
          {powered
            ? fa
              ? 'جریان برقرار است'
              : 'SYSTEM ENERGIZED'
            : fa
              ? 'آماده اتصال'
              : 'READY TO CONNECT'}
        </span>
        <button
          className="inspect-button"
          type="button"
          aria-expanded={inspect}
          aria-controls={inspect ? 'cabinet-inspector' : undefined}
          onClick={() => setInspect(!inspect)}
        >
          {fa ? 'نمای سه‌بعدی تابلو' : 'Inspect switchgear'}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
      <div className="motion-control">
        <span>
          {fa ? 'کلید را بزنید و مدار را روشن کنید' : 'A small switch. A bigger connection.'}
        </span>
        <button
          type="button"
          disabled={reduced}
          aria-pressed={paused}
          aria-label={reduced ? copy.reduced : paused ? copy.resume : copy.pause}
          onClick={() => store.getState().setMotionPaused(!paused)}
        >
          {reduced ? copy.reduced : paused ? copy.resume : copy.pause}
        </button>
      </div>
    </div>
  );
}
