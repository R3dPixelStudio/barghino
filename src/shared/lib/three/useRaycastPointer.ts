'use client';

import { useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Vector2 } from 'three';

export function useRaycastPointer(enabled: boolean) {
  const target = useRef(new Vector2(0.5, 0.5));
  return {
    target,
    onPointerMove: (event: ThreeEvent<PointerEvent>) => {
      if (enabled && event.uv) target.current.copy(event.uv);
    },
    onPointerOut: () => target.current.set(0.5, 0.5),
  };
}
