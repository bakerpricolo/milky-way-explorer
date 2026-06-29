"use client";

import { useMemo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { equatorialToXYZ } from "@/lib/coordinates";

export default function ExoplanetLayer() {
  const { exoplanets, setExoplanets, showExoplanets, viewMode, setSelectedStar, gaiaStars } = useStore();
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial | null>(null);

  // Fetch exoplanets on mount
  useEffect(() => {
    fetch("/api/exoplanets")
      .then((r) => r.json())
      .then((d) => { if (d.exoplanets) setExoplanets(d.exoplanets); })
      .catch(console.error);
  }, [setExoplanets]);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(exoplanets.length * 3);
    const colors    = new Float32Array(exoplanets.length * 3);

    exoplanets.forEach((ep, i) => {
      const { x, y, z } = equatorialToXYZ(ep.ra, ep.dec, ep.distancePc);
      positions[i * 3]     = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Habitable = green glow, others = orange
      if (ep.isHabitable) {
        colors[i * 3] = 0.2; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 0.4;
      } else {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.6; colors[i * 3 + 2] = 0.1;
      }
    });

    return { positions, colors };
  }, [exoplanets]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color",    new THREE.Float32BufferAttribute(colors,    3));
    return geo;
  }, [positions, colors]);

  // Pulse animation
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.size = 0.06 + Math.sin(clock.elapsedTime * 2) * 0.02;
    }
  });

  if (!showExoplanets || exoplanets.length === 0 || viewMode === "solar") return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        vertexColors
        size={0.07}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
