'use client';

import { Component, Suspense, useEffect, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Lightformer, PerformanceMonitor, Preload } from '@react-three/drei';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { useExperience, useExperienceApi } from '@/entities/experience/model/provider';
import type { MotionChannel } from '@/entities/experience/model/motion';
import { ElectricalCore } from '@/entities/energy-core/ui/ElectricalCore';
import { useCameraRig } from '@/shared/lib/three/useCameraRig';
import { scheduleAssetPreload } from '@/shared/lib/three/assets';

class WebGLErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Lifecycle({
  active,
  animate,
  onContextLost,
}: {
  active: boolean;
  animate: boolean;
  onContextLost: () => void;
}) {
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (active || !animate) invalidate();
  }, [active, animate, invalidate]);
  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onContextLost]);
  return null;
}

function Scene({ channel, animate }: { channel: MotionChannel; animate: boolean }) {
  const quality = useExperience((state) => state.quality);
  const store = useExperienceApi();
  useCameraRig(channel, animate);
  return (
    <>
      {animate && (
        <PerformanceMonitor
          flipflops={3}
          bounds={() => [35, 55]}
          onDecline={() => store.getState().setQuality('low')}
          onIncline={() => {
            if (!window.matchMedia('(pointer: coarse)').matches)
              store.getState().setQuality('high');
          }}
          onFallback={() => store.getState().setQuality('low')}
        />
      )}
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={3.5}
        castShadow={quality === 'high'}
        shadow-mapSize={[512, 512]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.001}
      />
      <pointLight position={[-3, 0, 2]} color="#f7db05" intensity={5} distance={9} />
      <Suspense fallback={null}>
        <Environment resolution={quality === 'low' ? 64 : 128} frames={1}>
          <Lightformer
            position={[0, 4, 2]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[6, 3, 1]}
            intensity={3}
            color="#e0e8ee"
          />
          <Lightformer
            position={[-4, 1, 0]}
            rotation={[0, Math.PI / 2, 0]}
            scale={[4, 5, 1]}
            intensity={2}
            color="#00a3b0"
          />
          <Lightformer position={[3, 0, 3]} scale={[2, 4, 1]} intensity={2.5} color="#ffffff" />
        </Environment>
        <ElectricalCore channel={channel} animate={animate} />
        {quality === 'high' && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.25, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <shadowMaterial opacity={0.3} transparent />
          </mesh>
        )}
        <Preload all />
      </Suspense>
    </>
  );
}

export default function GlobalExperience({
  channel,
  active,
  animate,
  fallback,
  onContextLost,
}: {
  channel: MotionChannel;
  active: boolean;
  animate: boolean;
  fallback: ReactNode;
  onContextLost: () => void;
}) {
  const quality = useExperience((state) => state.quality);
  const composition = useExperience((state) => state.composition);
  useEffect(() => scheduleAssetPreload(quality), [quality]);
  return (
    <WebGLErrorBoundary fallback={fallback}>
      <Canvas
        camera={{ position: [composition.cameraX, 0.75, 7.5], fov: 38, near: 0.1, far: 30 }}
        dpr={quality === 'low' ? 1 : quality === 'medium' ? 1.25 : 1.5}
        shadows={quality === 'high'}
        frameloop={!active ? 'never' : animate ? 'always' : 'demand'}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        fallback={fallback}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.outputColorSpace = SRGBColorSpace;
          gl.domElement.setAttribute('aria-hidden', 'true');
          gl.domElement.tabIndex = -1;
        }}
      >
        <Lifecycle active={active} animate={animate} onContextLost={onContextLost} />
        <Scene channel={channel} animate={animate} />
      </Canvas>
    </WebGLErrorBoundary>
  );
}
