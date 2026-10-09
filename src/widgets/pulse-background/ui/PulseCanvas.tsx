'use client';

import { Component, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector2, type ShaderMaterial } from 'three';
import { useExperience } from '@/entities/experience/model/provider';

type Props = { active: boolean; onFailure: () => void; onReady: () => void };
const vertex = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`;
const fragment = `
uniform float uTime; uniform float uPower; uniform float uSide; uniform float uMode; uniform float uScroll;
uniform vec2 uPointer; uniform vec2 uSize; varying vec2 vUv;
void main(){
  vec2 uv=vUv; uv.x=uSide<0.0 ? 1.0-uv.x : uv.x;
  vec2 mouse=uPointer; mouse.x=uSide<0.0 ? 1.0-mouse.x : mouse.x;
  float aspect=uSize.x/max(uSize.y,1.0);
  float signal=0.0; float bloom=0.0;
  for(int i=0;i<6;i++){
    float k=float(i);
    float curve=0.24+k*0.057+0.13*sin(uv.x*4.4+k*0.24+uScroll*2.0);
    float proximity=exp(-pow((uv.x-mouse.x)*3.5,2.0));
    curve+=(mouse.y-0.5)*0.25*proximity;
    curve+=sin(uv.x*(9.0+uMode*3.0)-uTime*0.9+k)*0.013*uPower;
    float d=abs(uv.y-curve);
    float line=exp(-d*420.0); float glow=exp(-d*33.0);
    float phase=fract(uv.x*1.6-uTime*(0.16+k*0.012+uMode*0.025)+k*0.15);
    float pulse=smoothstep(0.58,0.82,phase)*(1.0-smoothstep(0.82,1.0,phase));
    signal+=line*(0.16+pulse*1.1); bloom+=glow*pulse*0.14;
  }
  float edge=smoothstep(0.0,0.10,uv.x)*(1.0-smoothstep(0.87,1.0,uv.x));
  float radius=length((uv-mouse)*vec2(aspect,1.0));
  float ring=exp(-abs(radius-(0.10+fract(uTime*0.23)*0.38))*110.0);
  ring*=exp(-radius*6.0)*0.18*uPower;
  float aura=exp(-radius*5.0)*0.035*uPower;
  float gridx=abs(fract(uv.x*22.0*aspect)-0.5); float gridy=abs(fract(uv.y*22.0+uScroll*0.8)-0.5);
  float grid=(1.0-smoothstep(0.006,0.02,min(gridx,gridy)))*(0.009+aura*0.5);
  float power=0.10+uPower*0.90;
  float energy=(signal+bloom)*edge*power+ring+aura;
  gl_FragColor=vec4(vec3(0.96863,0.85882,0.01961)*energy+vec3(0.23,0.21,0.1)*grid,min(0.72,energy*0.64+grid));
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
  const mode = useExperience((s) => s.signalMode);
  const scroll = useRef(0);
  const side = useExperience((s) => s.composition.side);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const callbacks = useRef({ onReady, onFailure });
  callbacks.current = { onReady, onFailure };
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMode: { value: 0 },
      uScroll: { value: 0 },
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
  }, [active, powered, paused, reduced, side, mode, invalidate]);
  useEffect(() => {
    if (!animate) return;
    const timer = window.setInterval(invalidate, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [animate, invalidate]);
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
      if (!animate) invalidate();
    };
    const onScroll = () => {
      scroll.current =
        window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (active) invalidate();
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    gl.domElement.addEventListener('webglcontextlost', lost);
    window.addEventListener('pointermove', move, { passive: true });
    callbacks.current.onReady();
    return () => {
      gl.domElement.removeEventListener('webglcontextlost', lost);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', onScroll);
    };
  }, [gl, active, animate, invalidate]);
  useFrame((_, rawDelta) => {
    const live = material.current?.uniforms;
    if (!live) return;
    const delta = Math.min(rawDelta, 0.05);
    live.uPower.value = powered ? 1 : 0;
    live.uSide.value = side;
    live.uMode.value = mode;
    live.uScroll.value = scroll.current;
    live.uSize.value.set(size.width, size.height);
    if (animate) live.uPointer.value.lerp(pointer.current, 1 - Math.exp(-delta * 12));
    else live.uPointer.value.copy(pointer.current);
    if (animate) {
      live.uTime.value += delta;
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
