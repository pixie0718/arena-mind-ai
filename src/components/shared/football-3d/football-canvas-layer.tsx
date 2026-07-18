"use client";

import { Canvas } from "@react-three/fiber";
import { SparkleField } from "@/components/shared/football-3d/sparkle-field";

/**
 * Full-page ambient light-particle backdrop. The football itself moved
 * out to its own small, independently-positioned canvas
 * (`football-badge-canvas.tsx`) — see that file for why a full-viewport
 * canvas can't reliably place an element "just above the bottom nav" on
 * every screen size. Sparkles don't have that problem: they're a diffuse
 * wash across the whole page, not a single object with an exact required
 * position, so staying full-viewport (and rendering behind all content,
 * `-z-10`) is fine for them.
 */
export default function FootballCanvasLayer() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.75]}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.55} />
      <SparkleField />
    </Canvas>
  );
}
