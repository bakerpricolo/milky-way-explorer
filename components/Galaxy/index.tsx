"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import * as THREE from "three";
import GalaxyPoints    from "./GalaxyPoints";
import GaiaStars       from "./GaiaStars";
import SolarSystem, { SUN_POS } from "./SolarSystem";
import ExoplanetLayer  from "./ExoplanetLayer";
import PointsOfInterest from "./PointsOfInterest";
import { useStore }    from "@/lib/store";

const LY_PER_KPC = 3261.56;
const RULER_STEPS_LY = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

// Camera presets for each view mode
const CAMERA_PRESETS = {
  galaxy: { position: new THREE.Vector3(20, 10, 25),       target: new THREE.Vector3(0, 0, 0)   },
  local:  { position: new THREE.Vector3(10, 2.5, 7),        target: new THREE.Vector3(8.5, 0, 0) },
  solar:  { position: new THREE.Vector3(8.5, 0.05, 0.18),  target: SUN_POS.clone()              },
};

// ─── Camera controller ────────────────────────────────────────────────────────

function CameraController() {
  const { camera, controls } = useThree() as { camera: THREE.Camera; controls: unknown };
  const viewMode = useStore((s) => s.viewMode);
  const targetPos    = useRef(CAMERA_PRESETS.galaxy.position.clone());
  const targetLookAt = useRef(CAMERA_PRESETS.galaxy.target.clone());
  const isAnimating  = useRef(true);

  useEffect(() => {
    const preset = CAMERA_PRESETS[viewMode];
    targetPos.current.copy(preset.position);
    targetLookAt.current.copy(preset.target);
    isAnimating.current = true;
  }, [viewMode]);

  useFrame(() => {
    if (!isAnimating.current) return;

    camera.position.lerp(targetPos.current, 0.04);
    const oc = controls as { target?: THREE.Vector3; update?: () => void };
    if (oc?.target) {
      oc.target.lerp(targetLookAt.current, 0.04);
      oc.update?.();
    }

    const dist = camera.position.distanceTo(targetPos.current);
    if (dist < 0.001) isAnimating.current = false;
  });

  return null;
}

// ─── Scale ruler calculator ───────────────────────────────────────────────────

function ScaleCalculator() {
  const { camera, size } = useThree();
  const setRulerData = useStore((s) => s.setRulerData);
  const p1 = useRef(new THREE.Vector3());
  const p2 = useRef(new THREE.Vector3());

  useFrame(() => {
    let bestLy = RULER_STEPS_LY[0];
    let bestPx = 0;
    for (const ly of RULER_STEPS_LY) {
      const kpc = ly / LY_PER_KPC;
      p1.current.set(0, 0, 0).project(camera);
      p2.current.set(kpc, 0, 0).project(camera);
      const px = Math.abs(p2.current.x - p1.current.x) * size.width / 2;
      if (px >= 60 && px <= 250) { bestLy = ly; bestPx = px; break; }
      if (px < 60) { bestLy = ly; bestPx = px; }
    }
    setRulerData({ pixelWidth: bestPx, lightYears: bestLy });
  });

  return null;
}

// ─── Galactic centre glow ─────────────────────────────────────────────────────

function GalacticCentre() {
  const meshRef = useRef<THREE.Mesh>(null);
  const viewMode = useStore((s) => s.viewMode);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.18 + Math.sin(clock.elapsedTime * 0.4) * 0.04;
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

function SceneSetup() {
  const viewMode = useStore((s) => s.viewMode);

  return (
    <>
      <PerspectiveCamera makeDefault position={[20, 10, 25]} fov={55} near={0.0001} far={500} />
      <OrbitControls
        enablePan={false}
        minDistance={viewMode === "solar" ? 0.001 : 2}
        maxDistance={viewMode === "solar" ? 0.5  : 45}
        autoRotate={viewMode === "galaxy"}
        autoRotateSpeed={0.08}
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.05}
      />
    </>
  );
}

// ─── Main canvas ─────────────────────────────────────────────────────────────

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
        <SolarSystem />
        <ExoplanetLayer />
        <PointsOfInterest />
        <CameraController />
        <ScaleCalculator />
      </Suspense>
    </Canvas>
  );
}
