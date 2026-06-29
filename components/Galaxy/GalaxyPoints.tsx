"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { generateGalaxy } from "@/lib/galaxy";
import { vertexShader, fragmentShader } from "./shaders";
import { useStore } from "@/lib/store";

export default function GalaxyPoints() {
  const pointsRef   = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const viewMode    = useStore((s) => s.viewMode);

  const { positions, colors, sizes } = useMemo(() => generateGalaxy(), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("a_color",  new THREE.Float32BufferAttribute(colors,    3));
    geo.setAttribute("a_size",   new THREE.Float32BufferAttribute(sizes,     1));
    return geo;
  }, [positions, colors, sizes]);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
      uniforms: {
        u_time:       { value: 0 },
        u_pixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        u_opacity:    { value: 1.0 },
      },
    });
    materialRef.current = mat;
    return mat;
  }, []);

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.u_time.value = state.clock.elapsedTime;
    // Fade galaxy out in solar view
    const targetOpacity = viewMode === "solar" ? 0.0 : 1.0;
    const current = materialRef.current.uniforms.u_opacity.value as number;
    materialRef.current.uniforms.u_opacity.value = THREE.MathUtils.lerp(current, targetOpacity, 0.05);
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
