'use client';

import { useEffect, useRef } from 'react';
import type { AnimationItem } from 'lottie-web';

const pulse = {
  v: '5.12.2',
  fr: 24,
  ip: 0,
  op: 48,
  w: 24,
  h: 24,
  nm: 'Energy pulse',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Ring',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [80], e: [0], o: { x: 0.33, y: 0 }, i: { x: 0.67, y: 1 } },
            { t: 48, s: [0] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [12, 12, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            {
              t: 0,
              s: [35, 35, 100],
              e: [100, 100, 100],
              o: { x: 0.33, y: 0 },
              i: { x: 0.67, y: 1 },
            },
            { t: 48, s: [100, 100, 100] },
          ],
        },
      },
      shapes: [
        { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [16, 16] }, nm: 'Circle' },
        {
          ty: 'st',
          c: { a: 0, k: [0, 0.94, 1, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 1.5 },
          lc: 2,
          lj: 2,
          nm: 'Stroke',
        },
      ],
      ip: 0,
      op: 48,
      st: 0,
      bm: 0,
    },
  ],
};

export function SystemPulse({ animate }: { animate: boolean }) {
  const container = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!animate || !container.current) return;
    let cancelled = false;
    let animation: AnimationItem | undefined;
    void import('lottie-web/build/player/lottie_light').then(({ default: lottie }) => {
      if (cancelled || !container.current) return;
      animation = lottie.loadAnimation({
        container: container.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: structuredClone(pulse),
        rendererSettings: { progressiveLoad: true },
      });
    });
    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, [animate]);
  return (
    <span ref={container} className="system-pulse" aria-hidden="true">
      <span className="status-dot" />
    </span>
  );
}
