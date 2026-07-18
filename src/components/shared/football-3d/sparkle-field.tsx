"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTheme } from "next-themes";
import * as THREE from "three";

const PARTICLE_COUNT = 22;

/**
 * Pale pastel tones read as a soft glow against the dark "Stadium Night"
 * background, but the same colors at the same opacity are nearly invisible
 * against a near-white light background — richer, more saturated tones are
 * needed there to read as visible "pitch lights" rather than disappear.
 */
const PALETTE = {
  dark: { green: "#8fe3a8", gold: "#f2c94c", baseOpacity: 0.35, pulse: 0.13 },
  light: { green: "#1f9d52", gold: "#b8860b", baseOpacity: 0.55, pulse: 0.18 },
} as const;

/**
 * A drifting field of small glowing points — pitch-green and
 * floodlight-gold, matching the "Stadium Night" palette — for the ambient
 * "crowd lights" feel the football layer alone doesn't give. Pure
 * `THREE.Points`, no `@react-three/drei` dependency (not installed):
 * geometry/material built once via `useMemo`, then only rotated/drifted
 * per-frame rather than rebuilding attributes every frame. Rebuilt only
 * when the resolved theme actually changes (a rare event, not a per-frame
 * concern) so the same colors stay legible in both themes.
 */
export function SparkleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const { viewport } = useThree();
  const { resolvedTheme } = useTheme();
  const palette = resolvedTheme === "light" ? PALETTE.light : PALETTE.dark;

  const { geometry, material, baseOpacity, pulse } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const green = new THREE.Color(palette.green);
    const gold = new THREE.Color(palette.gold);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2.2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
      positions[i * 3 + 2] = -0.5 - Math.random() * 2.5;

      const color = Math.random() > 0.5 ? green : gold;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: palette.baseOpacity,
      sizeAttenuation: true,
      depthWrite: false,
    });

    return { geometry: geom, material: mat, baseOpacity: palette.baseOpacity, pulse: palette.pulse };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild only when the resolved theme's palette actually changes
  }, [palette.green, palette.gold, palette.baseOpacity]);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;
    points.rotation.y = state.clock.elapsedTime * 0.02;
    points.position.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.08;
    material.opacity = baseOpacity - pulse + Math.sin(state.clock.elapsedTime * 0.6) * pulse;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      scale={[viewport.width / 2, viewport.height / 2, 1]}
    />
  );
}
