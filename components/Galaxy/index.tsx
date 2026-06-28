"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import * as THREE from "three";
import GalaxyPoints from "./GalaxyPoints";
import GaiaStars    from "./GaiaStars";
import { useStore }  from "@/lib/store";

const LY_PER_KPC = 3261.56;

// Nice round ruler distances in light years
const RULER_STEPS_LY = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000];

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

/** Runs inside the canvas, projects a known 3D distance to screen pixels and stores it. */
function ScaleCalculator() {
  const { camera, size } = useThree();
  const setRulerData = useStore((s) => s.setRulerData);
  const p1 = useRef(new THREE.Vector3());
  const p2 = useRef(new THREE.Vector3());

  useFrame(() => {
    // Choose a ruler distance that projects to ~100–200px
    let bestLy   = RULER_STEPS_LY[0];
    let bestPx   = 0;

    for (const ly of RULER_STEPS_LY) {
      const kpc = ly / LY_PER_KPC;
      p1.current.set(0, 0, 0).project(camera);
      p2.current.set(kpc, 0, 0).project(camera);
      const px = Math.abs(p2.current.x - p1.current.x) * size.width / 2;
      if (px >= 60 && px <= 250) { bestLy = ly; bestPx = px; break; }
      if (px < 60) { bestLy = ly; bestPx = px; } // take the last too-small value as fallback
    }

    setRulerData({ pixelWidth: bestPx, lightYears: bestLy });
  });

  return null;
}

function SceneSetup() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[8.5, 6, 18]} fov={55} near={0.01} far={500} />
      <OrbitControls
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

export default function GalaxyCanvas() {
  return (
    <Canvas
      style={{ background: "#000010" }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.NoToneMapping }}
      dpr={[1, 2]}
    >
      <SceneSetup />
      <Stars radius={80} depth={60} count={3000} factor={3} saturation={0.3} fade />
      <ambientLight intensity={0.02} />
      <pointLight position={[0, 0, 0]} intensity={0.3} color="#ffaa44" decay={2} />
      <Suspense fallback={null}>
        <GalaxyPoints />
        <GaiaStars />
        <GalacticCentre />
        <ScaleCalculator />
      </Suspense>
    </Canvas>
  );
}
