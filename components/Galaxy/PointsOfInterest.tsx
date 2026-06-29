"use client";

import { useStore } from "@/lib/store";
import { Html } from "@react-three/drei";
import { equatorialToXYZ } from "@/lib/coordinates";
import { useMemo } from "react";
import type { PointOfInterest } from "@/types";

const POIS: PointOfInterest[] = [
  {
    id: "alpha-centauri",
    name: "Alpha Centauri",
    type: "star-system",
    ra: 219.902, dec: -60.835, distancePc: 1.34,
    description: "Our nearest stellar neighbours — a triple system 4.37 light years away. Proxima Centauri hosts the closest known exoplanet.",
    emoji: "⭐", color: "#ffdd88",
  },
  {
    id: "barnards-star",
    name: "Barnard's Star",
    type: "star",
    ra: 269.452, dec: 4.693, distancePc: 1.83,
    description: "The fastest moving star in our sky at 10.4 arcsec/year. A red dwarf 5.96 light years away. Once thought to host planets.",
    emoji: "💨", color: "#ff8866",
  },
  {
    id: "sirius",
    name: "Sirius System",
    type: "star-system",
    ra: 101.287, dec: -16.716, distancePc: 2.64,
    description: "The brightest star in the night sky. A binary system — Sirius A is 1.7× the Sun's mass; Sirius B is a white dwarf.",
    emoji: "✨", color: "#aaccff",
  },
  {
    id: "pleiades",
    name: "Pleiades Cluster",
    type: "cluster",
    ra: 56.601, dec: 24.114, distancePc: 136.0,
    description: "The famous Seven Sisters. A young open cluster ~100 million years old containing thousands of stars and hot blue giants.",
    emoji: "🔵", color: "#88aaff",
  },
  {
    id: "hyades",
    name: "Hyades Cluster",
    type: "cluster",
    ra: 66.752, dec: 15.867, distancePc: 46.0,
    description: "The nearest open cluster to Earth and one of the best-studied. About 625 million years old with ~200 confirmed members.",
    emoji: "🔴", color: "#ffaa66",
  },
  {
    id: "orion-nebula",
    name: "Orion Nebula",
    type: "nebula",
    ra: 83.822, dec: -5.391, distancePc: 412.0,
    description: "One of the most photographed objects in the sky. A massive stellar nursery 24 light years across, actively forming new stars.",
    emoji: "🌌", color: "#ff88aa",
  },
  {
    id: "betelgeuse",
    name: "Betelgeuse",
    type: "star",
    ra: 88.793, dec: 7.407, distancePc: 168.0,
    description: "A red supergiant nearing the end of its life. So large it would engulf Jupiter if placed at our Sun. Expected to supernova within 100,000 years.",
    emoji: "🔴", color: "#ff4422",
  },
  {
    id: "vega",
    name: "Vega",
    type: "star",
    ra: 279.235, dec: 38.784, distancePc: 7.68,
    description: "The brightest star in Lyra and 5th brightest in the sky. A blue-white A-type star with a protoplanetary debris disk — and the first star (after the Sun) to be photographed.",
    emoji: "💙", color: "#aabbff",
  },
];

function POIMarker({ poi }: { poi: PointOfInterest }) {
  const { x, y, z } = useMemo(
    () => equatorialToXYZ(poi.ra, poi.dec, poi.distancePc),
    [poi]
  );
  const viewMode = useStore((s) => s.viewMode);

  // Hide very distant objects in local/solar view
  if (viewMode === "solar") return null;
  if (viewMode === "local" && poi.distancePc > 500) return null;

  return (
    <Html position={[x, y, z]} center style={{ pointerEvents: "none" }}>
      <div className="flex flex-col items-center gap-0.5 select-none">
        <div
          className="text-sm cursor-default"
          style={{ filter: `drop-shadow(0 0 4px ${poi.color})` }}
        >
          {poi.emoji}
        </div>
        <div
          className="text-[9px] font-mono whitespace-nowrap px-1 py-0.5 rounded"
          style={{
            color: poi.color,
            background: "rgba(0,0,0,0.6)",
            border: `1px solid ${poi.color}40`,
            textShadow: `0 0 6px ${poi.color}`,
          }}
        >
          {poi.name}
        </div>
      </div>
    </Html>
  );
}

export default function PointsOfInterest() {
  const showPOIs = useStore((s) => s.showPOIs);
  if (!showPOIs) return null;
  return (
    <>
      {POIS.map((poi) => (
        <POIMarker key={poi.id} poi={poi} />
      ))}
    </>
  );
}
