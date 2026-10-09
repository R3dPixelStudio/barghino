'use client';

import { Component, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector2, type ShaderMaterial } from 'three';
import { useExperience } from '@/entities/experience/model/provider';

type Props = { active: boolean; onFailure: () => void; onReady: () => void };
const vertex = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`;
const fragment = `
uniform float uTime; uniform float uPower; uniform float uSide; uniform vec2 uPointer; uniform vec2 uSize;
varying vec2 vUv;
void main(){
  vec2 uv=vUv; uv.x=uSide<0.0 ? 1.0-uv.x : uv.x;
  float aspect=uSize.x/max(uSize.y,1.0);
  float signal=0.0; float bloom=0.0;
  for(int i=0;i<4;i++){
    float k=float(i); float curve=0.32+k*0.048+0.10*sin(uv.x*4.4+k*0.22);
    curve += (uPointer.y-0.5)*0.022*sin(uv.x*3.14159);
    float d=abs(uv.y-curve); float line=exp(-d*460.0); float glow=exp(-d*40.0);
    float phase=fract(uv.x*1.3-uTime*(0.08+k*0.008)+k*0.13);
    float pulse=smoothstep(0.65,0.86,phase)*(1.0-smoothstep(0.86,1.0,phase));
    signal+=line*(0.10+pulse*0.85); bloom+=glow*pulse*0.12;
  }
  float edge=smoothstep(0.0,0.18,uv.x)*(1.0-smoothstep(0.8,1.0,uv.x));
  float gridx=abs(fract(uv.x*24.0*aspect)-0.5); float gridy=abs(fract(uv.y*24.0)-0.5);
  float grid=(1.0-smoothstep(0.006,0.02,min(gridx,gridy)))*0.012;
  float focus=exp(-length((uv-vec2(0.67,0.40))*vec2(aspect,1.0))*5.0)*0.10;
  vec3 color=vec3(0.0,0.68,0.83)*(signal+bloom)*edge;
  float power=0.18+uPower*0.82;
  gl_FragColor=vec4(color*power+vec3(0.12,0.25,0.28)*(grid+focus), min(0.82,(signal+bloom)*edge*power+grid+focus));
}`;

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
  const pointer = useRef(new Vector2(0.5, 0.5));
  const powered = useExperience((s) => s.powered);
  const paused = useExperience((s) => s.motionPaused);
  const reduced = useExperience((s) => s.reducedMotion);
  const side = useExperience((s) => s.composition.side);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const callbacks = useRef({ onReady, onFailure });
  callbacks.current = { onReady, onFailure };
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPower: { value: 0 },
      uSide: { value: side },
      uPointer: { value: new Vector2(0.5, 0.5) },
      uSize: { value: new Vector2(1, 1) },
    }),
    [side],
  );
  const animate = active && powered && !paused && !reduced;
  // biome-ignore lint/correctness/useExhaustiveDependencies: Demand rendering needs one frame whenever an imperative shader input changes, including pause.
  useEffect(() => {
    if (active) invalidate();
  }, [active, powered, paused, reduced, side, invalidate]);
  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault();
      callbacks.current.onFailure();
    };
    const move = (event: PointerEvent) => {
      if (!active) return;
      const rect = gl.domElement.getBoundingClientRect();
      pointer.current.set(
        (event.clientX - rect.left) / rect.width,
        1 - (event.clientY - rect.top) / rect.height,
      );
      invalidate();
    };
    gl.domElement.addEventListener('webglcontextlost', lost);
    window.addEventListener('pointermove', move, { passive: true });
    callbacks.current.onReady();
    return () => {
      gl.domElement.removeEventListener('webglcontextlost', lost);
      window.removeEventListener('pointermove', move);
    };
  }, [gl, active, invalidate]);
  useFrame((_, rawDelta) => {
    const live = material.current?.uniforms;
    if (!live) return;
    const delta = Math.min(rawDelta, 0.05);
    live.uPower.value = powered ? 1 : 0;
    live.uSide.value = side;
    live.uSize.value.set(size.width, size.height);
    live.uPointer.value.copy(pointer.current);
    if (animate) {
      live.uTime.value += delta;
      invalidate();
    }
  });
  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
        transparent
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function PulseCanvas(props: Props) {
  return (
    <Boundary onFailure={props.onFailure}>
      <Canvas
        frameloop={props.active ? 'demand' : 'never'}
        dpr={1}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        fallback={<div />}
      >
        <Field {...props} />
      </Canvas>
    </Boundary>
  );
}
