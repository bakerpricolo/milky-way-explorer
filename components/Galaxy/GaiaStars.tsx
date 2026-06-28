"use client";

import { useRef, useMemo, useEffect } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { galacticToXYZ } from "@/lib/coordinates";
import { bpRpToTemperature, temperatureToRGB } from "@/lib/galaxy";
import { gaiaVertexShader, gaiaFragmentShader } from "./shaders";

/**
 * Compute a 3D velocity vector (kpc/year) from Gaia proper motion.
 *
 * pmra  (mas/yr) — proper motion in RA  direction (≈ galactic longitude)
 * pmdec (mas/yr) — proper motion in Dec direction (≈ galactic latitude)
 * l, b  (degrees) — galactic coordinates
 * parallax (mas)  — used to compute distance
 */
function computeVelocity(
  pmra: number,
  pmdec: number,
  l: number,
  b: number,
  parallax: number
): [number, number, number] {
  const dKpc = Math.min(1 / parallax, 5); // distance in kpc, capped at 5
  const lRad  = (l * Math.PI) / 180;
  const bRad  = (b * Math.PI) / 180;
  const masToRad = Math.PI / (180 * 3_600_000); // 1 mas → radians

  // Angular velocities in rad/yr
  const dldt = pmra  * masToRad; // ≈ dl/dt  (simplified: pmra ≈ pml)
  const dbdt = pmdec * masToRad; // ≈ db/dt

  // Galactocentric position derivatives (kpc/yr):
  // x_gc = SUN_X - d*cos(b)*cos(l)  → dx/dt = d*(sin(l)*dldt + sin(b)*cos(l)*dbdt)
  // y_gc = d*cos(b)*sin(l)          → dy/dt = d*(cos(l)*dldt - sin(b)*sin(l)*dbdt)  [Three Z]
  // z_gc = d*sin(b)                 → dz/dt = d*cos(b)*dbdt                          [Three Y]

  const vx =  dKpc * (Math.sin(lRad) * dldt + Math.sin(bRad) * Math.cos(lRad) * dbdt);
  const vy_threeZ = dKpc * (Math.cos(lRad) * dldt - Math.sin(bRad) * Math.sin(lRad) * dbdt);
  const vy_threeY = dKpc * Math.cos(bRad) * dbdt;

  // Three.js frame: Y = galactic Z (pole), Z = galactic Y
  return [vx, vy_threeY, vy_threeZ];
}

export default function GaiaStars() {
  const { gaiaStars, selectedStar, setSelectedStar, setGaiaLoaded, timeOffset } = useStore();
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Fetch Gaia stars once on mount
  useEffect(() => {
    fetch("/api/gaia")
      .then((r) => r.json())
      .then((data) => {
        if (data.stars) {
          useStore.getState().setGaiaStars(data.stars);
          setGaiaLoaded(true);
        }
      })
      .catch(console.error);
  }, [setGaiaLoaded]);

  // Build geometry buffers from star data
  const { positions, colors, sizes, selectedArr, velocities } = useMemo(() => {
    const n = gaiaStars.length;
    const positions   = new Float32Array(n * 3);
    const colors      = new Float32Array(n * 3);
    const sizes       = new Float32Array(n);
    const selectedArr = new Float32Array(n);
    const velocities  = new Float32Array(n * 3); // kpc/year

    gaiaStars.forEach((star, i) => {
      // Position
      if (star.l !== null && star.b !== null && star.parallax !== null && star.parallax > 0) {
        const { x, y, z } = galacticToXYZ(star.l, star.b, star.parallax);
        positions[i * 3]     = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Velocity from proper motion
        if (star.pmra !== null && star.pmdec !== null) {
          const [vx, vy, vz] = computeVelocity(
            star.pmra, star.pmdec, star.l, star.b, star.parallax
          );
          velocities[i * 3]     = vx;
          velocities[i * 3 + 1] = vy;
          velocities[i * 3 + 2] = vz;
        }
      } else {
        positions[i * 3] = positions[i * 3 + 1] = positions[i * 3 + 2] = 9999;
      }

      // Colour from temperature
      const bpRp = star.bp_rp ?? 0.7;
      const temp  = star.teff_val ?? bpRpToTemperature(bpRp);
      const [r, g, b] = temperatureToRGB(temp);
      colors[i * 3]     = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;

      // Size from magnitude
      const mag = star.phot_g_mean_mag ?? 8;
      sizes[i] = Math.max(0.03, (11 - mag) / 20) * 0.35;

      selectedArr[i] = star.source_id === selectedStar?.source_id ? 1 : 0;
    });

    return { positions, colors, sizes, selectedArr, velocities };
  }, [gaiaStars, selectedStar]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position",   new THREE.Float32BufferAttribute(positions,   3));
    geo.setAttribute("a_color",    new THREE.Float32BufferAttribute(colors,      3));
    geo.setAttribute("a_size",     new THREE.Float32BufferAttribute(sizes,       1));
    geo.setAttribute("a_selected", new THREE.Float32BufferAttribute(selectedArr, 1));
    geo.setAttribute("a_velocity", new THREE.Float32BufferAttribute(velocities,  3));
    return geo;
  }, [positions, colors, sizes, selectedArr, velocities]);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader:   gaiaVertexShader,
      fragmentShader: gaiaFragmentShader,
      transparent:    true,
      depthWrite:     false,
      blending:       THREE.AdditiveBlending,
      uniforms: {
        u_pixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        u_timeOffset: { value: 0 },
      },
    });
    materialRef.current = mat;
    return mat;
  }, []);

  // Update selection attribute
  useEffect(() => {
    if (!pointsRef.current) return;
    const selAttr = pointsRef.current.geometry.getAttribute("a_selected") as THREE.BufferAttribute;
    for (let i = 0; i < gaiaStars.length; i++) {
      selAttr.setX(i, gaiaStars[i].source_id === selectedStar?.source_id ? 1 : 0);
    }
    selAttr.needsUpdate = true;
  }, [selectedStar, gaiaStars]);

  // Push timeOffset to shader every frame
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_timeOffset.value = timeOffset;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.index !== undefined && gaiaStars[e.index]) {
      setSelectedStar(gaiaStars[e.index]);
    }
  };

  if (!gaiaStars.length) return null;

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      onClick={handleClick}
    />
  );
}
