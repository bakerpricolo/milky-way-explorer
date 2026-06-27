"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { generateGalaxy } from "@/lib/galaxy";
import { vertexShader, fragmentShader } from "./shaders";

export default function GalaxyPoints() {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate procedural galaxy once on mount
  const { positions, colors, sizes } = useMemo(() => generateGalaxy(), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("a_color",  new THREE.Float32BufferAttribute(colors,    3));
    geo.setAttribute("a_size",   new THREE.Float32BufferAttribute(sizes,     1));
    return geo;
  }, [positions, colors, sizes]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        u_time:       { value: 0 },
        u_pixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
      },
    });
  }, []);

  useFrame((state) => {
    if (material.uniforms.u_time) {
      material.uniforms.u_time.value = state.clock.elapsedTime;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
