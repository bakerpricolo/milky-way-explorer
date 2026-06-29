"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import type { Planet } from "@/types";

export const SUN_POS  = new THREE.Vector3(8.5, 0, 0);
export const AU_SCALE = 0.1;   // 1 AU = 0.1 Three.js units
const TIME_WARP       = 500_000; // simulated seconds per real second

// ─── Moon data ────────────────────────────────────────────────────────────────

interface MoonData {
  name: string;
  displayOrbit: number;  // radius in Three.js units (exaggerated for visibility)
  periodDays: number;    // negative = retrograde
  initialAngle: number;  // degrees
  color: string;
  radius: number;
  description: string;
}

const PLANET_MOONS: Record<string, MoonData[]> = {
  Earth: [
    { name: "Moon",     displayOrbit: 0.055, periodDays: 27.32,  initialAngle: 45,  color: "#cccccc", radius: 0.010, description: "Earth's only natural satellite. Stabilises our axial tilt and drives ocean tides. Formed from a giant impact 4.5 billion years ago." },
  ],
  Mars: [
    { name: "Phobos",   displayOrbit: 0.038, periodDays: 0.319,  initialAngle: 0,   color: "#aa8866", radius: 0.005, description: "Inner Martian moon — orbits faster than Mars rotates. Will crash into Mars in ~50 million years." },
    { name: "Deimos",   displayOrbit: 0.058, periodDays: 1.263,  initialAngle: 120, color: "#998877", radius: 0.004, description: "Outer Martian moon. Tiny and potato-shaped, drifting slowly away from Mars." },
  ],
  Jupiter: [
    { name: "Io",       displayOrbit: 0.10,  periodDays: 1.769,  initialAngle: 0,   color: "#ffcc33", radius: 0.012, description: "Most volcanically active body in the solar system. Hundreds of active volcanoes, driven by Jupiter's tidal forces." },
    { name: "Europa",   displayOrbit: 0.14,  periodDays: 3.551,  initialAngle: 80,  color: "#ddccbb", radius: 0.011, description: "Prime candidate for extraterrestrial life. A global subsurface ocean twice the volume of Earth's oceans lies beneath its icy crust." },
    { name: "Ganymede", displayOrbit: 0.20,  periodDays: 7.155,  initialAngle: 165, color: "#998877", radius: 0.015, description: "Largest moon in the solar system — bigger than Mercury. Has its own magnetic field." },
    { name: "Callisto", displayOrbit: 0.27,  periodDays: 16.689, initialAngle: 250, color: "#776655", radius: 0.014, description: "Most heavily cratered body in the solar system. Largely unchanged since the early solar system formed." },
  ],
  Saturn: [
    { name: "Titan",      displayOrbit: 0.13, periodDays: 15.945, initialAngle: 30,  color: "#ffaa44", radius: 0.015, description: "The only moon with a thick atmosphere and surface liquids. Lakes of liquid methane and ethane at −179°C." },
    { name: "Enceladus",  displayOrbit: 0.08, periodDays: 1.370,  initialAngle: 200, color: "#eeeeff", radius: 0.006, description: "Shoots geysers of water vapour and ice from its south pole into space — feeding Saturn's E ring." },
    { name: "Rhea",       displayOrbit: 0.10, periodDays: 4.518,  initialAngle: 100, color: "#ccbbaa", radius: 0.008, description: "Saturn's second-largest moon. Has a very thin ring of its own — the first found around a moon." },
  ],
  Uranus: [
    { name: "Titania",  displayOrbit: 0.10, periodDays: 8.706,  initialAngle: 30,  color: "#99bbcc", radius: 0.009, description: "Uranus's largest moon. Icy surface scarred by ancient canyons and impact craters." },
    { name: "Oberon",   displayOrbit: 0.13, periodDays: 13.463, initialAngle: 200, color: "#887766", radius: 0.008, description: "Uranus's second largest moon, heavily cratered with ancient mountains." },
    { name: "Miranda",  displayOrbit: 0.07, periodDays: 1.413,  initialAngle: 300, color: "#aabbcc", radius: 0.005, description: "One of the most bizarre objects in the solar system — huge cliffs, canyons and rolling terrain on a tiny body." },
  ],
  Neptune: [
    { name: "Triton",   displayOrbit: 0.09, periodDays: -5.877, initialAngle: 90,  color: "#aaccdd", radius: 0.011, description: "Orbits backwards (retrograde). Almost certainly a captured Kuiper Belt object. Has nitrogen geysers erupting from its surface." },
  ],
};

// ─── Planet data ──────────────────────────────────────────────────────────────

export const PLANETS: Planet[] = [
  { name: "Mercury", type: "rocky",     color: "#aaa9ad", radius: 0.008, orbitRadius: 0.387,  periodDays: 87.97,    initialAngleDeg: 178, tiltDeg: 0.03,  description: "The smallest planet and closest to the Sun. Scorching days, freezing nights. No atmosphere to retain heat.", diameter_km: 4879,   mass_earth: 0.055,  moons: 0,   dayLength: "58.6 days",  surfaceTemp: "-180 to 430°C", hasRings: false },
  { name: "Venus",   type: "rocky",     color: "#e8cda0", radius: 0.019, orbitRadius: 0.723,  periodDays: 224.70,   initialAngleDeg: 202, tiltDeg: 177.4, description: "The hottest planet. A runaway greenhouse effect traps heat under dense clouds of sulphuric acid.",           diameter_km: 12104,  mass_earth: 0.815,  moons: 0,   dayLength: "243 days",   surfaceTemp: "465°C",         hasRings: false },
  { name: "Earth",   type: "rocky",     color: "#4488ff", radius: 0.020, orbitRadius: 1.000,  periodDays: 365.25,   initialAngleDeg: 277, tiltDeg: 23.4,  description: "Our home. The only known planet with life, liquid oceans, plate tectonics, and a breathable atmosphere.",   diameter_km: 12742,  mass_earth: 1.000,  moons: 1,   dayLength: "24 hours",   surfaceTemp: "-89 to 58°C",   hasRings: false },
  { name: "Mars",    type: "rocky",     color: "#c1440e", radius: 0.011, orbitRadius: 1.524,  periodDays: 686.97,   initialAngleDeg: 265, tiltDeg: 25.2,  description: "The Red Planet. Home to Olympus Mons (tallest volcano in solar system) and ancient river valleys.",          diameter_km: 6779,   mass_earth: 0.107,  moons: 2,   dayLength: "24.6 hours", surfaceTemp: "-87 to -5°C",   hasRings: false },
  { name: "Jupiter", type: "gas-giant", color: "#c88b3a", radius: 0.060, orbitRadius: 5.203,  periodDays: 4332.59,  initialAngleDeg: 118, tiltDeg: 3.1,   description: "The king of planets. Over 1,300 Earths would fit inside. The Great Red Spot is a storm larger than Earth.",   diameter_km: 139820, mass_earth: 317.8,  moons: 95,  dayLength: "9.9 hours",  surfaceTemp: "-108°C (clouds)", hasRings: false },
  { name: "Saturn",  type: "gas-giant", color: "#ead6a8", radius: 0.050, orbitRadius: 9.537,  periodDays: 10759.22, initialAngleDeg: 14,  tiltDeg: 26.7,  description: "The ringed jewel. Its rings are made of ice and rock. Saturn is less dense than water.",                        diameter_km: 116460, mass_earth: 95.2,   moons: 146, dayLength: "10.7 hours", surfaceTemp: "-138°C (clouds)", hasRings: true  },
  { name: "Uranus",  type: "ice-giant", color: "#7de8e8", radius: 0.030, orbitRadius: 19.191, periodDays: 30688.5,  initialAngleDeg: 67,  tiltDeg: 97.8,  description: "The sideways planet — it rotates on its side from an ancient collision. Has 13 faint rings.",               diameter_km: 50724,  mass_earth: 14.5,   moons: 28,  dayLength: "17.2 hours", surfaceTemp: "-195°C",        hasRings: true  },
  { name: "Neptune", type: "ice-giant", color: "#3f54ba", radius: 0.028, orbitRadius: 30.069, periodDays: 60182.0,  initialAngleDeg: 3,   tiltDeg: 28.3,  description: "The windiest planet — gusts to 2,100 km/h. Discovered mathematically before it was ever observed.",         diameter_km: 49244,  mass_earth: 17.1,   moons: 16,  dayLength: "16.1 hours", surfaceTemp: "-200°C",        hasRings: false },
];

// ─── Orbit ring ────────────────────────────────────────────────────────────────

function OrbitRing({ radius }: { radius: number }) {
  const positions = useMemo(() => {
    const pts = new Float32Array(130 * 3);
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts[i * 3]     = SUN_POS.x + radius * Math.cos(a);
      pts[i * 3 + 1] = SUN_POS.y;
      pts[i * 3 + 2] = SUN_POS.z + radius * Math.sin(a);
    }
    return pts;
  }, [radius]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#ffffff" opacity={0.06} transparent />
    </line>
  );
}

// ─── Moon (positioned relative to parent planet group) ───────────────────────

function MoonMesh({ moon }: { moon: MoonData }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t         = clock.elapsedTime * TIME_WARP;
    const periodSec = Math.abs(moon.periodDays) * 86400;
    const dir       = moon.periodDays < 0 ? -1 : 1;
    const angle     = (moon.initialAngle * Math.PI / 180) + dir * (2 * Math.PI / periodSec) * t;
    meshRef.current.position.set(
      moon.displayOrbit * Math.cos(angle),
      0,
      moon.displayOrbit * Math.sin(angle),
    );
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[moon.radius, 8, 8]} />
      <meshStandardMaterial color={moon.color} emissive={moon.color} emissiveIntensity={0.3} roughness={0.9} />
    </mesh>
  );
}

// ─── Saturn rings ─────────────────────────────────────────────────────────────

function SaturnRingMesh() {
  return (
    <group rotation={[0, 0, 0.46]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.065, 0.120, 80]} />
        <meshBasicMaterial color="#d4c4a0" opacity={0.65} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.122, 0.145, 80]} />
        <meshBasicMaterial color="#e8d8b8" opacity={0.40} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Uranus rings ─────────────────────────────────────────────────────────────

function UranusRingMesh() {
  return (
    <mesh rotation={[0.1, 0, Math.PI / 2]}>
      <ringGeometry args={[0.038, 0.048, 64]} />
      <meshBasicMaterial color="#7de8e8" opacity={0.25} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Asteroid belt ────────────────────────────────────────────────────────────

function AsteroidBelt() {
  const positions = useMemo(() => {
    const count = 4000;
    const pts   = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r     = (2.2 + Math.random() * 1.0) * AU_SCALE;
      pts[i * 3]     = SUN_POS.x + r * Math.cos(angle);
      pts[i * 3 + 1] = (Math.random() - 0.5) * 0.012;
      pts[i * 3 + 2] = SUN_POS.z + r * Math.sin(angle);
    }
    return pts;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.0018} color="#aa9988" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SolarSystem() {
  const viewMode       = useStore((s) => s.viewMode);
  const setSelected    = useStore((s) => s.setSelectedPlanet);
  const selectedPlanet = useStore((s) => s.selectedPlanet);

  const planetGroupRefs = useRef<(THREE.Group | null)[]>(PLANETS.map(() => null));

  useFrame(({ clock }) => {
    if (viewMode !== "solar") return;
    const t = clock.elapsedTime * TIME_WARP;
    PLANETS.forEach((planet, i) => {
      const group = planetGroupRefs.current[i];
      if (!group) return;
      const r     = planet.orbitRadius * AU_SCALE;
      const angle = (planet.initialAngleDeg * Math.PI / 180)
                  + (2 * Math.PI / (planet.periodDays * 86400)) * t;
      group.position.set(
        SUN_POS.x + r * Math.cos(angle),
        SUN_POS.y,
        SUN_POS.z + r * Math.sin(angle),
      );
    });
  });

  if (viewMode !== "solar") return null;

  return (
    <group>
      {/* Sun */}
      <mesh position={SUN_POS}>
        <sphereGeometry args={[0.018, 32, 32]} />
        <meshBasicMaterial color="#fff9c4" />
      </mesh>
      <mesh position={SUN_POS}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color="#ffcc00" transparent opacity={0.08} depthWrite={false} />
      </mesh>
      <pointLight position={SUN_POS} intensity={4} color="#fff8e0" distance={8} decay={2} />
      <pointLight position={SUN_POS} intensity={1} color="#ffaa44" distance={20} decay={1} />

      {/* Asteroid belt */}
      <AsteroidBelt />

      {/* Orbit rings */}
      {PLANETS.map((p) => (
        <OrbitRing key={p.name} radius={p.orbitRadius * AU_SCALE} />
      ))}

      {/* Planets */}
      {PLANETS.map((planet, i) => {
        const isSelected = selectedPlanet?.name === planet.name;
        const moons      = PLANET_MOONS[planet.name] ?? [];

        return (
          <group
            key={planet.name}
            ref={(el) => { planetGroupRefs.current[i] = el; }}
          >
            {/* Planet sphere */}
            <mesh
              onClick={(e) => { e.stopPropagation(); setSelected(planet); }}
            >
              <sphereGeometry args={[planet.radius, 24, 24]} />
              <meshStandardMaterial
                color={planet.color}
                emissive={planet.color}
                emissiveIntensity={isSelected ? 0.7 : 0.25}
                roughness={0.75}
                metalness={0.05}
              />
            </mesh>

            {/* Rings */}
            {planet.hasRings && planet.name === "Saturn" && <SaturnRingMesh />}
            {planet.hasRings && planet.name === "Uranus" && <UranusRingMesh />}

            {/* Moons */}
            {moons.map((moon) => <MoonMesh key={moon.name} moon={moon} />)}

            {/* Label */}
            <Html
              position={[0, planet.radius + 0.015, 0]}
              center
              style={{ pointerEvents: "none" }}
            >
              <div style={{
                color:        isSelected ? "#00d4ff" : "rgba(255,255,255,0.75)",
                fontSize:     "9px",
                fontFamily:   "monospace",
                whiteSpace:   "nowrap",
                textShadow:   "0 0 6px rgba(0,0,0,1)",
                background:   "rgba(0,0,5,0.55)",
                padding:      "1px 5px",
                borderRadius: "3px",
                border:       isSelected ? "1px solid #00d4ff44" : "1px solid rgba(255,255,255,0.1)",
              }}>
                {planet.name}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
