'use client';

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, MathUtils, Vector2, type ShaderMaterial } from 'three';
import type { RefObject } from 'react';
import type { MotionChannel } from '@/entities/experience/model/motion';

export function useShaderUniforms(
  channel: MotionChannel,
  pointer: RefObject<Vector2>,
  animate: boolean,
  material: RefObject<ShaderMaterial | null>,
) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uPointer: { value: new Vector2(0.5, 0.5) },
      uNeon: { value: new Color('#f7db05') },
    }),
    [],
  );
  useFrame((_, rawDelta) => {
    const live = material.current?.uniforms;
    if (!live) return;
    const delta = Math.min(rawDelta, 0.05);
    if (animate) {
      live.uTime.value += delta;
      live.uPointer.value.lerp(pointer.current, 1 - Math.exp(-8 * delta));
      live.uScroll.value = MathUtils.damp(live.uScroll.value, channel.scroll, 6, delta);
    } else {
      live.uPointer.value.set(0.5, 0.5);
    }
  });
  return uniforms;
}
