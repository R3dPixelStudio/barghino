'use client';

import { useRef } from 'react';
import { AdditiveBlending, DoubleSide, type ShaderMaterial } from 'three';
import type { MotionChannel } from '@/entities/experience/model/motion';
import { useRaycastPointer } from '@/shared/lib/three/useRaycastPointer';
import { useShaderUniforms } from '@/shared/lib/three/useShaderUniforms';
import { energyVertex, energyFragment } from '../shaders/energy';

export function HeroEnergyShader({
  channel,
  animate,
}: {
  channel: MotionChannel;
  animate: boolean;
}) {
  const { target, ...events } = useRaycastPointer(animate);
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useShaderUniforms(channel, target, animate, material);
  return (
    <mesh position={[0, 0, 0.91]} {...events}>
      <planeGeometry args={[3.6, 3.8]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={energyVertex}
        fragmentShader={energyFragment}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}
