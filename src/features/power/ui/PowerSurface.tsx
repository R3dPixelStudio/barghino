'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useExperience } from '@/entities/experience/model/provider';

export function PowerSurface({ children }: { children: ReactNode }) {
  const powered = useExperience((state) => state.powered);
  const reduced = useExperience((state) => state.reducedMotion);
  const paused = useExperience((state) => state.motionPaused);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const sync = () => setVisible(document.visibilityState === 'visible');
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);
  return (
    <div
      className="power-world"
      data-powered={powered}
      data-motion={!reduced && !paused && visible}
      data-testid="power-world"
    >
      {children}
    </div>
  );
}
