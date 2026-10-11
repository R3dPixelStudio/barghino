'use client';

import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CurvePath,
  LineCurve3,
  Shape,
  Vector3,
  type Group,
  type Mesh,
  type ShaderMaterial,
} from 'three';
import { conductorFragment, conductorVertex } from '../lib/current-shaders';
import { useExperience } from '@/entities/experience/model/provider';
import { brushedMetal, metalProgramKey } from '../lib/brushed-metal';

export type CoreSignals = {
  time: number;
  power: number;
  mode: number;
  tap: number;
  pointerX: number;
  pointerY: number;
  side: number;
  anchor: { x: number; y: number; width: number; visible: boolean };
};

function roundedPlate(width: number, height: number, radius: number) {
  const x = -width / 2,
    y = -height / 2;
  const shape = new Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}
const extrusion = {
  depth: 0.1,
  bevelEnabled: true,
  bevelSegments: 2,
  steps: 1,
  bevelSize: 0.035,
  bevelThickness: 0.025,
  curveSegments: 5,
};

function Plate({
  width,
  height,
  z,
  color,
}: {
  width: number;
  height: number;
  z: number;
  color: string;
}) {
  const shape = useMemo(() => roundedPlate(width, height, 0.18), [width, height]);
  return (
    <mesh position={[0, 0, z]}>
      <extrudeGeometry args={[shape, extrusion]} />
      <meshStandardMaterial
        color={color}
        metalness={0.72}
        roughness={0.34}
        onBeforeCompile={brushedMetal}
        customProgramCacheKey={metalProgramKey}
      />
    </mesh>
  );
}

const routes = [
  {
    mode: 0,
    points: [
      [-0.7, 0.26],
      [-1.2, 0.26],
      [-1.93, 0.99],
      [-2.48, 0.99],
    ],
  },
  {
    mode: 0,
    points: [
      [-0.7, 0.1],
      [-1.33, 0.1],
      [-2.04, 0.81],
      [-2.48, 0.81],
    ],
  },
  {
    mode: 1,
    points: [
      [0.08, -0.7],
      [0.08, -1.0],
      [0.68, -1.6],
      [2.16, -1.6],
    ],
  },
  {
    mode: 1,
    points: [
      [0.26, -0.7],
      [0.26, -0.98],
      [0.69, -1.41],
      [2.16, -1.41],
    ],
  },
  {
    mode: 2,
    points: [
      [0.7, 0.2],
      [1.28, 0.2],
      [1.94, 0.86],
      [2.48, 0.86],
    ],
  },
  {
    mode: 2,
    points: [
      [0.7, 0.38],
      [1.23, 0.38],
      [1.89, 1.04],
      [2.48, 1.04],
    ],
  },
] as const;

function Conductor({ index, signals }: { index: number; signals: RefObject<CoreSignals> }) {
  const material = useRef<ShaderMaterial>(null);
  const path = useMemo(() => {
    const route = routes[index];
    const curve = new CurvePath<Vector3>();
    for (let i = 1; i < route.points.length; i++) {
      const a = route.points[i - 1],
        b = route.points[i];
      curve.add(new LineCurve3(new Vector3(a[0], a[1], 0.25), new Vector3(b[0], b[1], 0.25)));
    }
    return curve;
  }, [index]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPower: { value: 1 },
      uEmphasis: { value: 0 },
      uSeed: { value: index * 0.17 },
      uTap: { value: 0 },
    }),
    [index],
  );
  useFrame(() => {
    const live = material.current?.uniforms;
    if (!live || !signals.current.anchor.visible) return;
    live.uTime.value = signals.current.time;
    live.uPower.value = signals.current.power;
    live.uEmphasis.value = signals.current.mode === routes[index].mode ? 1 : 0;
    live.uTap.value = signals.current.tap;
  });
  return (
    <mesh>
      <tubeGeometry args={[path, 48, 0.024, 6, false]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={conductorVertex}
        fragmentShader={conductorFragment}
        toneMapped={false}
      />
    </mesh>
  );
}

export function SystemCore({ signals }: { signals: RefObject<CoreSignals> }) {
  const mode = useExperience((s) => s.signalMode);
  const powered = useExperience((s) => s.powered);
  const root = useRef<Group>(null);
  const assembly = useRef<Group>(null);
  const rotor = useRef<Mesh>(null);
  const faceOffset = useRef(new Vector3());
  useFrame(() => {
    const state = signals.current;
    if (!root.current || !assembly.current) return;
    root.current.visible = state.anchor.visible;
    if (!state.anchor.visible) return;
    root.current.position.set(state.anchor.x, state.anchor.y, 0);
    root.current.scale.setScalar(state.anchor.width / 620);
    // Locale reverses the viewing angle, never normals or triangle winding.
    assembly.current.rotation.set(
      -0.3 + state.pointerY * 0.035,
      state.side * (0.24 + state.pointerX * 0.045),
      state.side * 0.16,
    );
    faceOffset.current.set(0, 0, 0.47).applyEuler(assembly.current.rotation);
    assembly.current.position.set(-faceOffset.current.x, -faceOffset.current.y, 0);
    if (rotor.current) rotor.current.rotation.z = state.time * 0.11;
  }, -1);
  return (
    <group ref={root} visible={false}>
      <group ref={assembly}>
        <Plate width={5.35} height={3.82} z={-0.48} color="#25282a" />
        <Plate width={5.22} height={3.7} z={-0.26} color="#515756" />
        <Plate width={5.09} height={3.58} z={-0.08} color="#171b1d" />
        {routes.map((route, index) => (
          <Conductor
            key={`${route.mode}/${route.points[0][0]}/${route.points[0][1]}`}
            index={index}
            signals={signals}
          />
        ))}
        {[-1, 1].flatMap((x) =>
          [-1, 1].map((y) => (
            <mesh
              key={`${x}/${y}`}
              position={[x * 2.28, y * 1.5, 0.15]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.043, 0.043, 0.035, 8]} />
              <meshStandardMaterial color="#7b8079" metalness={0.8} roughness={0.28} />
            </mesh>
          )),
        )}
        {routes
          .filter((_, index) => index % 2 === 0)
          .map((route, index) => {
            const end = route.points[route.points.length - 1];
            return (
              <group key={route.mode} position={[end[0], end[1], 0.25]}>
                <mesh>
                  <boxGeometry args={[0.18, 0.3, 0.1]} />
                  <meshStandardMaterial color="#555b57" metalness={0.85} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0, 0.058]}>
                  <boxGeometry args={[0.032, 0.2, 0.012]} />
                  <meshBasicMaterial color={powered && index === mode ? '#f7db05' : '#666d64'} />
                </mesh>
              </group>
            );
          })}
        <mesh position={[0, 0, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.89, 0.89, 0.22, 64]} />
          <meshStandardMaterial color="#646a66" metalness={0.88} roughness={0.24} />
        </mesh>
        <mesh position={[0, 0, 0.4]}>
          <torusGeometry args={[0.82, 0.028, 8, 64]} />
          <meshStandardMaterial color="#bbc0ab" metalness={0.8} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.77, 0.79, 0.14, 64]} />
          <meshStandardMaterial color="#252b2d" metalness={0.75} roughness={0.27} />
        </mesh>
        <mesh ref={rotor} position={[0, 0, 0.46]}>
          <torusGeometry args={[0.665, 0.012, 6, 64, Math.PI * 1.45]} />
          <meshBasicMaterial color="#f7db05" transparent opacity={powered ? 0.55 : 0.08} />
        </mesh>
        <mesh position={[0, 0, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.6, 0.62, 0.1, 64]} />
          <meshStandardMaterial color="#14191b" metalness={0.65} roughness={0.26} />
        </mesh>
      </group>
    </group>
  );
}
