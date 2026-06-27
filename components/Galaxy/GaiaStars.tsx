"use client";

import { useRef, useMemo, useEffect } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { galacticToXYZ } from "@/lib/coordinates";
import { bpRpToTemperature, temperatureToRGB } from "@/lib/galaxy";
import { gaiaVertexShader, gaiaFragmentShader } from "./shaders";

export default function GaiaStars() {
  const { gaiaStars, selectedStar, setSelectedStar, setGaiaLoaded } = useStore();
  const pointsRef = useRef<THREE.Points>(null);

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

  const { positions, colors, sizes, selectedArr } = useMemo(() => {
    const n = gaiaStars.length;
    const positions    = new Float32Array(n * 3);
    const colors       = new Float32Array(n * 3);
    const sizes        = new Float32Array(n);
    const selectedArr  = new Float32Array(n);

    gaiaStars.forEach((star, i) => {
      // Position
      if (star.l !== null && star.b !== null && star.parallax !== null && star.parallax > 0) {
        const { x, y, z } = galacticToXYZ(star.l, star.b, star.parallax);
        positions[i * 3]     = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      } else {
        // Place far off-screen if no valid position
        positions[i * 3] = positions[i * 3 + 1] = positions[i * 3 + 2] = 9999;
      }

      // Colour from BP–RP or default G-star
      const bpRp = star.bp_rp ?? 0.7;
      const temp = star.teff_val ?? bpRpToTemperature(bpRp);
      const [r, g, b] = temperatureToRGB(temp);
      colors[i * 3]     = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;

      // Size from magnitude (brighter = larger point)
      const mag = star.phot_g_mean_mag ?? 8;
      sizes[i] = Math.max(0.03, (11 - mag) / 20) * 0.35;

      // Is this star selected?
      selectedArr[i] = star.source_id === selectedStar?.source_id ? 1 : 0;
    });

    return { positions, colors, sizes, selectedArr };
  }, [gaiaStars, selectedStar]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position",   new THREE.Float32BufferAttribute(positions,   3));
    geo.setAttribute("a_color",    new THREE.Float32BufferAttribute(colors,      3));
    geo.setAttribute("a_size",     new THREE.Float32BufferAttribute(sizes,       1));
    geo.setAttribute("a_selected", new THREE.Float32BufferAttribute(selectedArr, 1));
    return geo;
  }, [positions, colors, sizes, selectedArr]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader:   gaiaVertexShader,
        fragmentShader: gaiaFragmentShader,
        transparent:    true,
        depthWrite:     false,
        blending:       THREE.AdditiveBlending,
        uniforms: {
          u_pixelRatio: {
            value: typeof window !== "undefined" ? window.devicePixelRatio : 1,
          },
        },
      }),
    []
  );

  // Update selection attribute when selected star changes
  useEffect(() => {
    if (!pointsRef.current) return;
    const selAttr = pointsRef.current.geometry.getAttribute(
      "a_selected"
    ) as THREE.BufferAttribute;
    for (let i = 0; i < gaiaStars.length; i++) {
      selAttr.setX(i, gaiaStars[i].source_id === selectedStar?.source_id ? 1 : 0);
    }
    selAttr.needsUpdate = true;
  }, [selectedStar, gaiaStars]);

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
