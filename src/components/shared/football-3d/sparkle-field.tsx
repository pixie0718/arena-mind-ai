"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 22;

/**
 * A drifting field of small glowing points — pitch-green and
 * floodlight-gold, matching the "Stadium Night" palette — for the ambient
 * "crowd lights" feel the football layer alone doesn't give. Pure
 * `THREE.Points`, no `@react-three/drei` dependency (not installed):
 * geometry/material built once via `useMemo`, then only rotated/drifted
 * per-frame rather than rebuilding attributes every frame.
 */
export function SparkleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const { viewport } = useThree();

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const green = new THREE.Color("#8fe3a8");
    const gold = new THREE.Color("#f2c94c");

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
      opacity: 0.35,
      sizeAttenuation: true,
      depthWrite: false,
    });

    return { geometry: geom, material: mat };
  }, []);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;
    points.rotation.y = state.clock.elapsedTime * 0.02;
    points.position.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.08;
    material.opacity = 0.22 + Math.sin(state.clock.elapsedTime * 0.6) * 0.13;
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
