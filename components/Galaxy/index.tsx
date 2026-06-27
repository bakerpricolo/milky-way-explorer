"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Stars,
} from "@react-three/drei";
import * as THREE from "three";
import GalaxyPoints from "./GalaxyPoints";
import GaiaStars    from "./GaiaStars";
import { useStore }  from "@/lib/store";

// ─── Galactic centre glow ────────────────────────────────────────────────────

function GalacticCentre() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.18 + Math.sin(clock.elapsedTime * 0.4) * 0.04;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[0.6, 32, 32]} />
      <meshBasicMaterial color="#ffaa33" transparent opacity={0.2} depthWrite={false} />
    </mesh>
  );
}

// ─── Camera auto-rotate scene component ─────────────────────────────────────

function SceneSetup() {
  const { camera } = useThree();
  const controlsRef = useRef<{ target: THREE.Vector3; update: () => void } | null>(null);
  const focusTarget = useStore((s) => s.focusTarget);
  const setFocus    = useStore((s) => s.setFocusTarget);

  useFrame(() => {
    // Smoothly move to focus target when set
    if (focusTarget && controlsRef.current) {
      // Just clear for now; actual fly-to requires OrbitControls damping
      setFocus(null);
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[8.5, 6, 18]}
        fov={55}
        near={0.01}
        far={500}
      />
      <OrbitControls
        ref={controlsRef as React.Ref<unknown>}
        enablePan={false}
        minDistance={2}
        maxDistance={45}
        autoRotate
        autoRotateSpeed={0.08}
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI * 0.80}
        minPolarAngle={Math.PI * 0.10}
        target={new THREE.Vector3(0, 0, 0)}
      />
    </>
  );
}

// ─── Galaxy canvas ────────────────────────────────────────────────────────────

export default function GalaxyCanvas() {
  return (
    <Canvas
      style={{ background: "#000010" }}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.NoToneMapping,
      }}
      dpr={[1, 2]}
    >
      <SceneSetup />

      {/* Distant background stars */}
      <Stars radius={80} depth={60} count={3000} factor={3} saturation={0.3} fade />

      {/* Ambient dim light */}
      <ambientLight intensity={0.02} />

      {/* Galactic centre point light – warm orange glow */}
      <pointLight position={[0, 0, 0]} intensity={0.3} color="#ffaa44" decay={2} />

      <Suspense fallback={null}>
        {/* 200 000 procedural stars */}
        <GalaxyPoints />

        {/* Real Gaia DR3 stars (loaded async) */}
        <GaiaStars />

        {/* Galactic centre glow sphere */}
        <GalacticCentre />
      </Suspense>
    </Canvas>
  );
}
