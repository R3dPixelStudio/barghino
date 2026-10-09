'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CatmullRomCurve3,
  MathUtils,
  Object3D,
  Vector3,
  type Group,
  type InstancedMesh,
} from 'three';
import { useExperienceApi } from '@/entities/experience/model/provider';
import type { MotionChannel } from '@/entities/experience/model/motion';
import { HeroEnergyShader } from './HeroEnergyShader';

function CoolingFins() {
  const mesh = useRef<InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (!mesh.current) return;
    const transform = new Object3D();
    for (let index = 0; index < 15; index++) {
      transform.position.set(0, -1.05 + index * 0.15, 0);
      transform.rotation.x = Math.PI / 2;
      const scale = 0.93 + Math.sin((index / 14) * Math.PI) * 0.12;
      transform.scale.setScalar(scale);
      transform.updateMatrix();
      mesh.current.setMatrixAt(index, transform.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
    invalidate();
  }, [invalidate]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 15]} castShadow receiveShadow>
      <torusGeometry args={[0.81, 0.065, 8, 64]} />
      <meshStandardMaterial color="#555b60" metalness={0.92} roughness={0.32} />
    </instancedMesh>
  );
}

function Conduit({ side }: { side: number }) {
  const curve = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(side * 0.4, -1.2, 0),
        new Vector3(side * 0.6, -1.8, 0),
        new Vector3(side * 1.35, -1.85, 0),
        new Vector3(side * 1.75, -1.2, -0.5),
        new Vector3(side * 1.8, 0.3, -0.7),
      ]),
    [side],
  );
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 48, 0.055, 8, false]} />
      <meshStandardMaterial color="#343a3f" metalness={0.8} roughness={0.4} />
    </mesh>
  );
}

export function ElectricalCore({ channel, animate }: { channel: MotionChannel; animate: boolean }) {
  const group = useRef<Group>(null);
  const store = useExperienceApi();
  const elapsed = useRef(0);
  const previousSide = useRef<number | null>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    const { composition, motionPaused } = store.getState();
    if (motionPaused && previousSide.current === composition.side) return;
    previousSide.current = composition.side;
    const dt = Math.min(delta, 0.05);
    if (animate) elapsed.current += dt;
    const yaw = composition.assetYaw + (animate ? Math.sin(elapsed.current * 0.28) * 0.07 : 0);
    const progress = animate ? channel.scroll : 0;
    group.current.rotation.y = animate
      ? MathUtils.damp(group.current.rotation.y, yaw + progress * composition.side * 0.2, 5, dt)
      : yaw;
    group.current.position.set(
      composition.assetX,
      animate ? Math.sin(elapsed.current * 0.6) * 0.035 : 0,
      0,
    );
  });
  return (
    <group ref={group} rotation={[0, 0, -0.27]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.67, 0.67, 2.4, 48]} />
        <meshStandardMaterial color="#21272d" metalness={0.9} roughness={0.3} />
      </mesh>
      <CoolingFins />
      {[-1, 1].map((sign) => (
        <group key={sign} position={[0, sign * 1.23, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.86, 0.86, 0.12, 64]} />
            <meshStandardMaterial color="#71777c" metalness={0.95} roughness={0.23} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.65, 0.018, 8, 64]} />
            <meshStandardMaterial
              color="#f7db05"
              emissive="#f7db05"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, sign * 0.11, 0]}>
            <cylinderGeometry args={[0.43, 0.43, 0.13, 48]} />
            <meshStandardMaterial color="#30383e" metalness={0.9} roughness={0.27} />
          </mesh>
        </group>
      ))}
      {[-0.37, 0, 0.37].map((x) => (
        <mesh key={x} position={[x, 0, 0.69]}>
          <boxGeometry args={[0.045, 2.22, 0.045]} />
          <meshStandardMaterial
            color="#f7db05"
            emissive="#f7db05"
            emissiveIntensity={1.8}
            toneMapped={false}
          />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <Conduit key={side} side={side} />
      ))}
      <HeroEnergyShader channel={channel} animate={animate} />
    </group>
  );
}
