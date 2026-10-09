'use client';

import { Component, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useExperience } from '@/entities/experience/model/provider';
import { BuildingCircuit } from '@/shared/ui/BuildingCircuit';

class InspectorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="inspector-fallback">
        <BuildingCircuit />
      </div>
    ) : (
      this.props.children
    );
  }
}

function ContextLifecycle({ onLost }: { onLost: () => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault();
      onLost();
    };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onLost]);
  return null;
}

function Switchgear({ powered }: { powered: boolean }) {
  const color = powered ? '#00f0ff' : '#263c42';
  return (
    <group position={[0, -0.15, 0]}>
      {[-1.12, 0, 1.12].map((x, index) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.04, 2.8, 0.6]} />
            <meshStandardMaterial color="#55616a" metalness={0.55} roughness={0.55} />
          </mesh>
          <mesh position={[0, 0, 0.32]}>
            <boxGeometry args={[0.95, 2.66, 0.03]} />
            <meshStandardMaterial color="#bdc5c7" metalness={0.22} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.84, 0.36]}>
            <boxGeometry args={[0.61, 0.4, 0.07]} />
            <meshStandardMaterial color="#132126" roughness={0.7} />
          </mesh>
          {[0.27, 0.03, -0.21].map((y) => (
            <mesh key={y} position={[0, y, 0.37]}>
              <boxGeometry args={[0.66, 0.04, 0.05]} />
              <meshStandardMaterial color="#9fa9ad" metalness={0.8} roughness={0.45} />
            </mesh>
          ))}
          {[-0.2, 0, 0.2].map((bx) => (
            <group key={bx} position={[bx, 0.04, 0.4]}>
              <mesh>
                <boxGeometry args={[0.15, 0.53, 0.17]} />
                <meshStandardMaterial color="#e2e3df" roughness={0.7} />
              </mesh>
              <mesh position={[0, powered ? 0.07 : -0.07, 0.1]}>
                <boxGeometry args={[0.09, 0.21, 0.08]} />
                <meshStandardMaterial color="#18272e" roughness={0.5} />
              </mesh>
            </group>
          ))}
          <mesh position={[0.28, 0.84, 0.42]}>
            <sphereGeometry args={[0.04, 10, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={powered ? 2 : 0}
            />
          </mesh>
          <mesh position={[0.37, -0.51, 0.39]}>
            <boxGeometry args={[0.045, 0.3, 0.05]} />
            <meshStandardMaterial color="#30383c" metalness={0.7} roughness={0.4} />
          </mesh>
          {[-0.86, -0.81, -0.76, -0.71, -0.66, -0.61].map((y) => (
            <mesh key={y} position={[0, y, 0.346]}>
              <boxGeometry args={[0.55, 0.014, 0.01]} />
              <meshStandardMaterial color="#5b666b" />
            </mesh>
          ))}
          <mesh position={[0, 1.31, 0.351]}>
            <boxGeometry args={[0.93, 0.07, 0.02]} />
            <meshStandardMaterial color={index === 0 ? '#c3a24d' : '#314c59'} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -1.53, 0]}>
        <boxGeometry args={[3.5, 0.25, 0.88]} />
        <meshStandardMaterial color="#252e35" metalness={0.5} roughness={0.65} />
      </mesh>
      {[-0.9, -0.3, 0.3, 0.9].map((x) => (
        <mesh key={x} position={[x, 1.5, -0.15]}>
          <cylinderGeometry args={[0.025, 0.025, 0.28, 8]} />
          <meshStandardMaterial color="#b87333" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export default function CabinetInspector({
  powered,
  active,
}: {
  powered: boolean;
  active: boolean;
}) {
  const side = useExperience((state) => state.composition.side);
  const [lost, setLost] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  useEffect(() => {
    const sync = () => setTabVisible(document.visibilityState === 'visible');
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);
  if (lost)
    return (
      <div className="inspector-fallback">
        <BuildingCircuit />
      </div>
    );
  return (
    <InspectorBoundary>
      <Canvas
        camera={{ position: [side * 3.4, 2.1, 6.4], fov: 38 }}
        dpr={1}
        frameloop={active && tabVisible ? 'demand' : 'never'}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        fallback={<BuildingCircuit />}
        onCreated={({ gl }) => {
          gl.domElement.tabIndex = -1;
          gl.domElement.setAttribute('aria-hidden', 'true');
        }}
      >
        <ContextLifecycle onLost={() => setLost(true)} />
        <ambientLight intensity={1.6} />
        <directionalLight position={[3, 4, 5]} intensity={3} />
        <directionalLight color="#66c6d3" position={[-3, 0, 2]} intensity={0.6} />
        <Suspense fallback={null}>
          <Switchgear powered={powered} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableDamping={false}
          minPolarAngle={0.65}
          maxPolarAngle={1.8}
          minAzimuthAngle={-0.65}
          maxAzimuthAngle={0.65}
        />
      </Canvas>
    </InspectorBoundary>
  );
}
