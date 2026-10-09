'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { MotionChannel } from '@/entities/experience/model/motion';

export function useScrollBridge(channel: MotionChannel, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    gsap.registerPlugin(ScrollTrigger);
    const hero = document.getElementById('hero');
    if (!hero) return;
    const context = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.65,
            invalidateOnRefresh: true,
          },
        })
        .fromTo(
          channel,
          { scroll: 0 },
          { scroll: 1, duration: 1, ease: 'none', immediateRender: false },
        );
    }, hero);
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
      context.revert();
    };
  }, [channel, enabled]);
}
