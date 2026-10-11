'use client';

import { Component, memo, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { Vector2, type ShaderMaterial } from 'three';
import { useExperience } from '@/entities/experience/model/provider';
import { fieldFragment, fieldVertex } from '../lib/current-shaders';
import { SystemCore, type CoreSignals } from './SystemCore';

type Props = { active: boolean; onFailure: () => void; onReady: () => void };

const StudioLight = memo(function StudioLight() {
  return (
    <Environment resolution={64} frames={1} environmentIntensity={0.45}>
      <Lightformer
        position={[0, 5, 5]}
        target={[0, 0, 0]}
        scale={[10, 1, 1]}
        intensity={2}
        color="#e9eee6"
      />
      <Lightformer
        position={[5, 0, 4]}
        target={[0, 0, 0]}
        scale={[1, 6, 1]}
        intensity={1.2}
        color="#d0cda2"
      />
      <Lightformer
        position={[-5, -3, 3]}
        target={[0, 0, 0]}
        scale={[7, 3, 1]}
        intensity={0.7}
        color="#a3b2b5"
      />
    </Environment>
  );
});

class Boundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Field({ active, onFailure, onReady }: Props) {
  const material = useRef<ShaderMaterial>(null);
  const reportedReady = useRef(false);
  const pointer = useRef(new Vector2(0.5, 0.5));
  const tap = useRef({ position: new Vector2(0.5, 0.5), age: 10 });
  const powered = useExperience((s) => s.powered);
  const paused = useExperience((s) => s.motionPaused);
  const reduced = useExperience((s) => s.reducedMotion);
  const mode = useExperience((s) => s.signalMode);
  const side = useExperience((s) => s.composition.side);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const dirtyLayout = useRef(true);
  const callbacks = useRef({ onReady, onFailure });
  callbacks.current = { onReady, onFailure };
  const state = useRef({ active, powered, paused, reduced });
  state.current = { active, powered, paused, reduced };
  const signals = useRef<CoreSignals>({
    time: 0,
    power: 1,
    mode: 0,
    tap: 0,
    pointerX: 0,
    pointerY: 0,
    side,
    anchor: { x: 0, y: 0, width: 0, visible: false },
  });
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPower: { value: 1 },
      uSide: { value: 1 },
      uMode: { value: 0 },
      uPointer: { value: new Vector2(0.5, 0.5) },
      uTap: { value: new Vector2(0.5, 0.5) },
      uTapAge: { value: 10 },
      uSize: { value: new Vector2(1, 1) },
    }),
    [],
  );
  const animate = active && powered && !paused && !reduced;
  // biome-ignore lint/correctness/useExhaustiveDependencies: Render one demand frame for every imperative visual state change.
  useEffect(() => {
    if (active) invalidate();
  }, [active, powered, paused, reduced, side, mode, invalidate]);
  useEffect(() => {
    if (!animate) return;
    const timer = window.setInterval(invalidate, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [animate, invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    const anchor = document.getElementById('system-core');
    let cancelled = false;
    const lost = (event: Event) => {
      event.preventDefault();
      callbacks.current.onFailure();
    };
    const coordinates = (event: PointerEvent, target: Vector2) => {
      target.set(
        Math.min(1, Math.max(0, event.clientX / window.innerWidth)),
        Math.min(1, Math.max(0, 1 - event.clientY / window.innerHeight)),
      );
    };
    const move = (event: PointerEvent) => {
      const current = state.current;
      if (
        !current.active ||
        !current.powered ||
        current.paused ||
        current.reduced ||
        !event.isPrimary
      )
        return;
      coordinates(event, pointer.current);
    };
    const inject = (event: PointerEvent) => {
      const current = state.current;
      if (
        !current.active ||
        !current.powered ||
        current.paused ||
        current.reduced ||
        !event.isPrimary ||
        event.button !== 0
      )
        return;
      if (
        event.target instanceof Element &&
        event.target.closest('input,textarea,select,[contenteditable],dialog')
      )
        return;
      coordinates(event, tap.current.position);
      coordinates(event, pointer.current);
      tap.current.age = 0;
      invalidate();
    };
    const layout = () => {
      dirtyLayout.current = true;
      if (state.current.active) invalidate();
    };
    const observer = new ResizeObserver(layout);
    if (anchor) observer.observe(anchor);
    layout();
    canvas.addEventListener('webglcontextlost', lost);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', inject, { passive: true });
    window.addEventListener('scroll', layout, { passive: true });
    window.addEventListener('resize', layout, { passive: true });
    document.fonts.ready.then(() => {
      if (!cancelled) layout();
    });
    return () => {
      cancelled = true;
      observer.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', inject);
      window.removeEventListener('scroll', layout);
      window.removeEventListener('resize', layout);
    };
  }, [gl, invalidate]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: R3F size changes require a new DOM anchor measurement.
  useEffect(() => {
    dirtyLayout.current = true;
    invalidate();
  }, [size.width, size.height, invalidate]);
  useFrame((_, rawDelta) => {
    const live = material.current?.uniforms;
    if (!live) return;
    const delta = Math.min(rawDelta, 0.05);
    if (dirtyLayout.current) {
      const rect = document.getElementById('system-core')?.getBoundingClientRect();
      signals.current.anchor = rect
        ? {
            x: (rect.left + rect.width / 2 - size.width / 2) / 100,
            y: (size.height / 2 - rect.top - rect.height / 2) / 100,
            width: rect.width,
            visible: rect.bottom > 0 && rect.top < size.height && rect.width > 0,
          }
        : { x: 0, y: 0, width: 0, visible: false };
      dirtyLayout.current = false;
    }
    live.uPower.value = powered ? 1 : 0;
    live.uSide.value = side;
    live.uMode.value = mode;
    live.uSize.value.set(size.width, size.height);
    if (animate) {
      live.uTime.value += delta;
      live.uPointer.value.lerp(pointer.current, 1 - Math.exp(-delta * 5));
      tap.current.age = Math.min(10, tap.current.age + delta);
    } else tap.current.age = 10;
    live.uTap.value.copy(tap.current.position);
    live.uTapAge.value = tap.current.age;
    Object.assign(signals.current, {
      time: live.uTime.value,
      power: powered ? 1 : 0,
      mode,
      side,
      tap: animate ? Math.max(0, 1 - tap.current.age / 1.65) : 0,
      pointerX: (live.uPointer.value.x - 0.5) * 2,
      pointerY: (live.uPointer.value.y - 0.5) * 2,
    });
  }, -2);
  return (
    <>
      <mesh
        renderOrder={-10}
        frustumCulled={false}
        onAfterRender={() => {
          if (!reportedReady.current) {
            reportedReady.current = true;
            callbacks.current.onReady();
          }
        }}
      >
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={fieldVertex}
          fragmentShader={fieldFragment}
          transparent
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </mesh>
      <ambientLight intensity={0.35} />
      <directionalLight position={[-4, 5, 8]} intensity={0.65} color="#e9ece4" />
      <directionalLight position={[5, -2, 4]} intensity={0.3} color="#a3afae" />
      <StudioLight />
      <SystemCore signals={signals} />
    </>
  );
}

export default function PulseCanvas(props: Props) {
  return (
    <Boundary onFailure={props.onFailure}>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 20], zoom: 100, near: 0.1, far: 100 }}
        frameloop={props.active ? 'demand' : 'never'}
        dpr={1}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        fallback={<div />}
      >
        <Field {...props} />
      </Canvas>
    </Boundary>
  );
}
