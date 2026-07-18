"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createFootballTexture } from "@/components/shared/football-3d/football-texture";

interface FootballMeshProps {
  position: [number, number, number];
  scale?: number;
  spinSpeed?: number;
  opacity?: number;
  /** [vx, vy] drift velocity in world units/second — bounces off `bounds`. */
  velocity: [number, number];
  /** Half-width/half-height of the area this ball bounces around inside. */
  bounds: { width: number; height: number };
}

/**
 * A solid, opaque, spinning sphere that drifts and bounces off the edges
 * of `bounds` (classic "DVD logo" motion) instead of sitting in one spot
 * with a small sine-wave bob — the bob read as static/lifeless. Position
 * and velocity are held in refs and mutated directly in `useFrame` rather
 * than React state, since this needs to update every frame without
 * triggering re-renders.
 */
export function FootballMesh({
  position,
  scale = 1,
  spinSpeed = 0.5,
  opacity = 0.95,
  velocity,
  bounds,
}: FootballMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => createFootballTexture(), []);
  const pos = useRef<[number, number]>([position[0], position[1]]);
  const vel = useRef<[number, number]>(velocity);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.rotation.y += delta * spinSpeed;
    mesh.rotation.x += delta * spinSpeed * 0.6;

    const maxX = bounds.width - scale;
    const maxY = bounds.height - scale;
    let [x, y] = pos.current;
    let [vx, vy] = vel.current;
    x += vx * delta;
    y += vy * delta;
    if (x > maxX || x < -maxX) {
      vx = -vx;
      x = Math.max(-maxX, Math.min(maxX, x));
    }
    if (y > maxY || y < -maxY) {
      vy = -vy;
      y = Math.max(-maxY, Math.min(maxY, y));
    }
    pos.current = [x, y];
    vel.current = [vx, vy];
    mesh.position.set(x, y, position[2]);
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[1, 40, 40]} />
      <meshStandardMaterial map={texture} roughness={0.4} metalness={0.12} transparent opacity={opacity} />
    </mesh>
  );
}
