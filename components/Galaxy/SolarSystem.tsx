"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import type { Planet } from "@/types";

// Sun position in galactocentric kpc
export const SUN_POS = new THREE.Vector3(8.5, 0, 0);

// 1 AU in kpc display units (scaled up massively for visibility)
export const AU_SCALE = 0.006;

// Time warp: real seconds → simulated seconds
const TIME_WARP = 500_000;

// Planet data with J2000 approximate positions (June 28, 2026 ≈ 9674 days from J2000)
export const PLANETS: Planet[] = [
  {
    name: "Mercury", type: "rocky",
    color: "#aaa9ad", radius: 0.0008, orbitRadius: 0.387, periodDays: 87.97,
    initialAngleDeg: 178, tiltDeg: 0.03,
    description: "The smallest planet and closest to the Sun. Surface temperatures swing from -180°C to 430°C. A year lasts just 88 Earth days.",
    diameter_km: 4879, mass_earth: 0.055, moons: 0, dayLength: "58.6 days", surfaceTemp: "-180 to 430°C", hasRings: false,
  },
  {
    name: "Venus", type: "rocky",
    color: "#e8cda0", radius: 0.0018, orbitRadius: 0.723, periodDays: 224.70,
    initialAngleDeg: 202, tiltDeg: 177.4,
    description: "The hottest planet despite not being closest to the Sun. Thick CO₂ atmosphere creates a runaway greenhouse effect — 465°C on the surface.",
    diameter_km: 12104, mass_earth: 0.815, moons: 0, dayLength: "243 days", surfaceTemp: "465°C", hasRings: false,
  },
  {
    name: "Earth", type: "rocky",
    color: "#4488ff", radius: 0.0019, orbitRadius: 1.000, periodDays: 365.25,
    initialAngleDeg: 277, tiltDeg: 23.4,
    description: "Our home. The only known planet with life, liquid water oceans, and plate tectonics. One Moon stabilises its axial tilt.",
    diameter_km: 12742, mass_earth: 1.0, moons: 1, dayLength: "24 hours", surfaceTemp: "-89 to 58°C", hasRings: false,
  },
  {
    name: "Mars", type: "rocky",
    color: "#c1440e", radius: 0.0010, orbitRadius: 1.524, periodDays: 686.97,
    initialAngleDeg: 265, tiltDeg: 25.2,
    description: "The Red Planet. Home to Olympus Mons, the tallest volcano in the solar system. Thin atmosphere, ancient river valleys, and possible past life.",
    diameter_km: 6779, mass_earth: 0.107, moons: 2, dayLength: "24.6 hours", surfaceTemp: "-87 to -5°C", hasRings: false,
  },
  {
    name: "Jupiter", type: "gas-giant",
    color: "#c88b3a", radius: 0.006, orbitRadius: 5.203, periodDays: 4332.59,
    initialAngleDeg: 118, tiltDeg: 3.1,
    description: "The largest planet — over 1,300 Earths would fit inside. The Great Red Spot is a storm that has raged for centuries. 95 known moons.",
    diameter_km: 139820, mass_earth: 317.8, moons: 95, dayLength: "9.9 hours", surfaceTemp: "-108°C (cloud tops)", hasRings: false,
  },
  {
    name: "Saturn", type: "gas-giant",
    color: "#ead6a8", radius: 0.005, orbitRadius: 9.537, periodDays: 10759.22,
    initialAngleDeg: 14, tiltDeg: 26.7,
    description: "The ringed jewel of the solar system. Its rings are mostly ice and rock. Saturn is less dense than water — it would float in a large enough ocean.",
    diameter_km: 116460, mass_earth: 95.2, moons: 146, dayLength: "10.7 hours", surfaceTemp: "-138°C (cloud tops)", hasRings: true,
  },
  {
    name: "Uranus", type: "ice-giant",
    color: "#7de8e8", radius: 0.003, orbitRadius: 19.19, periodDays: 30688.5,
    initialAngleDeg: 67, tiltDeg: 97.8,
    description: "The sideways planet — it rotates on its side, likely from an ancient collision. Ice giant with a faint ring system and 28 known moons.",
    diameter_km: 50724, mass_earth: 14.5, moons: 28, dayLength: "17.2 hours", surfaceTemp: "-195°C", hasRings: true,
  },
  {
    name: "Neptune", type: "ice-giant",
    color: "#3f54ba", radius: 0.0028, orbitRadius: 30.07, periodDays: 60182.0,
    initialAngleDeg: 3, tiltDeg: 28.3,
    description: "The windiest planet — storms reach 2,100 km/h. Discovered mathematically before it was observed. Its moon Triton orbits backwards.",
    diameter_km: 49244, mass_earth: 17.1, moons: 16, dayLength: "16.1 hours", surfaceTemp: "-200°C", hasRings: false,
  },
];

// ─── Orbit ring ────────────────────────────────────────────────────────────────

function OrbitRing({ radius, visible }: { radius: number; visible: boolean }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        SUN_POS.x + radius * Math.cos(a),
        SUN_POS.y,
        SUN_POS.z + radius * Math.sin(a)
      ));
    }
    return pts;
  }, [radius]);

  if (!visible) return null;

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#ffffff" opacity={0.08} transparent />
    </line>
  );
}

// ─── Saturn ring ──────────────────────────────────────────────────────────────

function SaturnRings({ position }: { position: THREE.Vector3 }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2.5, 0, 0]}>
      <ringGeometry args={[0.007, 0.013, 64]} />
      <meshBasicMaterial color="#c8b89a" opacity={0.6} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SolarSystem() {
  const viewMode      = useStore((s) => s.viewMode);
  const setSelected   = useStore((s) => s.setSelectedPlanet);
  const selectedPlanet = useStore((s) => s.selectedPlanet);

  const meshRefs = useRef<(THREE.Mesh | null)[]>(PLANETS.map(() => null));

  const visible = viewMode === "solar" || viewMode === "local";

  useFrame(({ clock }) => {
    if (!visible) return;
    const simTime = clock.elapsedTime * TIME_WARP;
    PLANETS.forEach((planet, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      const periodSec = planet.periodDays * 86400;
      const angle     = (planet.initialAngleDeg * Math.PI / 180) + (2 * Math.PI / periodSec) * simTime;
      const r         = planet.orbitRadius * AU_SCALE;
      mesh.position.set(
        SUN_POS.x + r * Math.cos(angle),
        SUN_POS.y,
        SUN_POS.z + r * Math.sin(angle)
      );
      mesh.rotation.y += 0.01;
    });
  });

  if (!visible) return null;

  return (
    <group>
      {/* Sun glow */}
      <mesh position={SUN_POS}>
        <sphereGeometry args={[0.003, 16, 16]} />
        <meshBasicMaterial color="#fff4aa" />
      </mesh>
      <pointLight position={SUN_POS} intensity={2} color="#fff4aa" distance={1} decay={2} />

      {/* Orbit rings */}
      {PLANETS.map((p) => (
        <OrbitRing key={p.name} radius={p.orbitRadius * AU_SCALE} visible={viewMode === "solar"} />
      ))}

      {/* Planets */}
      {PLANETS.map((planet, i) => (
        <group key={planet.name}>
          <mesh
            ref={(el) => { meshRefs.current[i] = el; }}
            onClick={(e) => { e.stopPropagation(); setSelected(planet); }}
          >
            <sphereGeometry args={[planet.radius, 16, 16]} />
            <meshStandardMaterial
              color={planet.color}
              emissive={planet.color}
              emissiveIntensity={selectedPlanet?.name === planet.name ? 0.8 : 0.3}
              roughness={0.7}
            />
          </mesh>
          {planet.hasRings && (
            <SaturnRings position={meshRefs.current[i]?.position ?? SUN_POS} />
          )}
        </group>
      ))}
    </group>
  );
}
