"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import * as THREE from "three";
import GalaxyPoints      from "./GalaxyPoints";
import GaiaStars         from "./GaiaStars";
import SolarSystem, { SUN_POS } from "./SolarSystem";
import ExoplanetLayer    from "./ExoplanetLayer";
import PointsOfInterest  from "./PointsOfInterest";
import { useStore }      from "@/lib/store";
import type { ViewMode } from "@/lib/store";

const LY_PER_KPC    = 3261.56;
const RULER_STEPS   = [5,10,25,50,100,250,500,1000,2500,5000,10000,25000,50000,100000];

// ─── Camera presets ───────────────────────────────────────────────────────────

const PRESETS: Record<ViewMode, { pos: [number,number,number]; target: [number,number,number]; minD: number; maxD: number }> = {
  galaxy: { pos: [20,  10,  25],       target: [0,   0,   0],   minD: 2,    maxD: 50   },
  local:  { pos: [11,  2.5, 7],        target: [8.5, 0,   0],   minD: 0.5,  maxD: 15   },
  solar:  { pos: [8.5, 2.5, 5],        target: [8.5, 0,   0],   minD: 0.01, maxD: 8    },
};

// ─── Camera controller ────────────────────────────────────────────────────────

function CameraController({ controlsRef }: { controlsRef: React.MutableRefObject<any> }) {
  const viewMode = useStore((s) => s.viewMode);
  const targetPos    = useRef(new THREE.Vector3(...PRESETS.galaxy.pos));
  const targetLookAt = useRef(new THREE.Vector3(...PRESETS.galaxy.target));

  useEffect(() => {
    const p = PRESETS[viewMode];
    targetPos.current.set(...p.pos);
    targetLookAt.current.set(...p.target);
    if (controlsRef.current) {
      controlsRef.current.minDistance  = p.minD;
      controlsRef.current.maxDistance  = p.maxD;
      controlsRef.current.autoRotate   = viewMode === "galaxy";
    }
  }, [viewMode, controlsRef]);

  useFrame(() => {
    const oc = controlsRef.current;
    if (!oc) return;
    oc.object.position.lerp(targetPos.current, 0.07);
    oc.target.lerp(targetLookAt.current, 0.07);
    oc.update();
  });

  return null;
}

// ─── Scale ruler ─────────────────────────────────────────────────────────────

function ScaleCalculator() {
  const { camera, size } = useThree();
  const setRuler = useStore((s) => s.setRulerData);
  const p1 = useRef(new THREE.Vector3());
  const p2 = useRef(new THREE.Vector3());

  useFrame(() => {
    let bestLy = RULER_STEPS[0], bestPx = 0;
    for (const ly of RULER_STEPS) {
      const kpc = ly / LY_PER_KPC;
      p1.current.set(0, 0, 0).project(camera);
      p2.current.set(kpc, 0, 0).project(camera);
      const px = Math.abs(p2.current.x - p1.current.x) * size.width / 2;
      if (px >= 60 && px <= 250) { bestLy = ly; bestPx = px; break; }
      if (px < 60) { bestLy = ly; bestPx = px; }
    }
    setRuler({ pixelWidth: bestPx, lightYears: bestLy });
  });

  return null;
}

// ─── Galactic centre ──────────────────────────────────────────────────────────

function GalacticCentre() {
  const meshRef  = useRef<THREE.Mesh>(null);
  const viewMode = useStore((s) => s.viewMode);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.18 + Math.sin(clock.elapsedTime * 0.4) * 0.04;
    }
  });
  if (viewMode === "solar") return null;
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[0.6, 32, 32]} />
      <meshBasicMaterial color="#ffaa33" transparent opacity={0.2} depthWrite={false} />
    </mesh>
  );
}

// ─── Scene setup ─────────────────────────────────────────────────────────────

function SceneSetup({ controlsRef }: { controlsRef: React.MutableRefObject<any> }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[20,10,25]} fov={55} near={0.0001} far={500} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={2}
        maxDistance={50}
        autoRotate
        autoRotateSpeed={0.08}
        enableDamping
        dampingFactor={0.06}
        maxPolarAngle={Math.PI * 0.88}
        minPolarAngle={Math.PI * 0.03}
      />
    </>
  );
}

// ─── Galaxy canvas ───────────────────────────────────────────────────────────

export default function GalaxyCanvas() {
  const controlsRef = useRef<any>(null);

  return (
    <Canvas
      style={{ background: "#000010" }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.NoToneMapping }}
      dpr={[1, 2]}
    >
      <SceneSetup controlsRef={controlsRef} />

      <Stars radius={80} depth={60} count={4000} factor={3} saturation={0.2} fade />
      <ambientLight intensity={0.015} />
      <pointLight position={[0, 0, 0]} intensity={0.3} color="#ffaa44" decay={2} />

      <Suspense fallback={null}>
        <GalacticCentre />
        <GalaxyPoints />
        <GaiaStars />
        <SolarSystem />
        <ExoplanetLayer />
        <PointsOfInterest />
        <CameraController controlsRef={controlsRef} />
        <ScaleCalculator />
      </Suspense>
    </Canvas>
  );
}
