'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import { useExperienceApi } from '@/entities/experience/model/provider';
import type { MotionChannel } from '@/entities/experience/model/motion';

export function useCameraRig(channel: MotionChannel, animate: boolean) {
  const store = useExperienceApi();
  const previousSide = useRef<number | null>(null);
  useFrame(({ camera }, delta) => {
    const { composition, reducedMotion, motionPaused } = store.getState();
    if (motionPaused && previousSide.current === composition.side) return;
    previousSide.current = composition.side;
    const progress = reducedMotion ? 0 : channel.scroll;
    const x = composition.cameraX * (1 - progress * 0.3);
    const y = 0.75 + progress * 0.7;
    const z = 7.5 + progress * 0.8;
    if (animate) {
      camera.position.x = MathUtils.damp(camera.position.x, x, 5, Math.min(delta, 0.05));
      camera.position.y = MathUtils.damp(camera.position.y, y, 5, Math.min(delta, 0.05));
      camera.position.z = MathUtils.damp(camera.position.z, z, 5, Math.min(delta, 0.05));
    } else camera.position.set(x, y, z);
    camera.lookAt(composition.assetX, 0, 0);
  });
}
