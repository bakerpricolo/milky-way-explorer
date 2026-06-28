"use client";

import { useRef, useMemo, useEffect } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { galacticToXYZ } from "@/lib/coordinates";
import { bpRpToTemperature, temperatureToRGB } from "@/lib/galaxy";
import { gaiaVertexShader, gaiaFragmentShader } from "./shaders";
import { getSpectralClass } from "@/components/UI/FilterPanel";

function computeVelocity(
  pmra: number, pmdec: number, l: number, b: number, parallax: number
): [number, number, number] {
  const dKpc   = Math.min(1 / parallax, 5);
  const lRad   = (l * Math.PI) / 180;
  const bRad   = (b * Math.PI) / 180;
  const masToRad = Math.PI / (180 * 3_600_000);
  const dldt   = pmra  * masToRad;
  const dbdt   = pmdec * masToRad;
  const vx     =  dKpc * (Math.sin(lRad) * dldt + Math.sin(bRad) * Math.cos(lRad) * dbdt);
  const vyThreeZ = dKpc * (Math.cos(lRad) * dldt - Math.sin(bRad) * Math.sin(lRad) * dbdt);
  const vyThreeY = dKpc * Math.cos(bRad) * dbdt;
  return [vx, vyThreeY, vyThreeZ];
}

export default function GaiaStars() {
  const { gaiaStars, selectedStar, setSelectedStar, setGaiaLoaded, timeOffset, spectralFilter } = useStore();
  const pointsRef  = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

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

  const { positions, colors, sizes, selectedArr, velocities } = useMemo(() => {
    const n          = gaiaStars.length;
    const positions  = new Float32Array(n * 3);
    const colors     = new Float32Array(n * 3);
    const sizes      = new Float32Array(n);
    const selectedArr = new Float32Array(n);
    const velocities = new Float32Array(n * 3);

    gaiaStars.forEach((star, i) => {
      if (star.l !== null && star.b !== null && star.parallax !== null && star.parallax > 0) {
        const { x, y, z } = galacticToXYZ(star.l, star.b, star.parallax);
        positions[i * 3]     = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        if (star.pmra !== null && star.pmdec !== null) {
          const [vx, vy, vz] = computeVelocity(star.pmra, star.pmdec, star.l, star.b, star.parallax);
          velocities[i * 3]     = vx;
          velocities[i * 3 + 1] = vy;
          velocities[i * 3 + 2] = vz;
        }
      } else {
        positions[i * 3] = positions[i * 3 + 1] = positions[i * 3 + 2] = 9999;
      }

      const bpRp = star.bp_rp ?? 0.7;
      const temp  = star.teff_val ?? bpRpToTemperature(bpRp);
      const [r, g, b] = temperatureToRGB(temp);
      colors[i * 3]     = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;

      // Apply spectral filter — zero size hides the star
      const spectralClass = getSpectralClass(star.teff_val, star.bp_rp);
      const visible       = spectralFilter[spectralClass] ?? true;
      const mag           = star.phot_g_mean_mag ?? 8;
      sizes[i] = visible ? Math.max(0.03, (11 - mag) / 20) * 0.35 : 0;

      selectedArr[i] = star.source_id === selectedStar?.source_id ? 1 : 0;
    });

    return { positions, colors, sizes, selectedArr, velocities };
  }, [gaiaStars, selectedStar, spectralFilter]);

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

  useEffect(() => {
    if (!pointsRef.current) return;
    const selAttr = pointsRef.current.geometry.getAttribute("a_selected") as THREE.BufferAttribute;
    for (let i = 0; i < gaiaStars.length; i++) {
      selAttr.setX(i, gaiaStars[i].source_id === selectedStar?.source_id ? 1 : 0);
    }
    selAttr.needsUpdate = true;
  }, [selectedStar, gaiaStars]);

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
    <points ref={pointsRef} geometry={geometry} material={material} onClick={handleClick} />
  );
}
