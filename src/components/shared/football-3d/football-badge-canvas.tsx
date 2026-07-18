"use client";

import { Canvas } from "@react-three/fiber";
import { FootballMesh } from "@/components/shared/football-3d/football-mesh";

/**
 * Its own small WebGL context sized/positioned entirely by CSS (see
 * `floating-football-layer.tsx`), independent of the full-page sparkle
 * canvas. A single ball centered in a small fixed box, spinning in
 * place — no viewport-fraction math needed since the box itself is a
 * known, fixed pixel size regardless of the page's real content or
 * screen height.
 */
export default function FootballBadgeCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 40 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.75]}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={1.8} color="#8fe3a8" />
      <directionalLight position={[-4, -2, 3]} intensity={1} color="#f2c94c" />
      <pointLight position={[0, 0, 4]} intensity={0.6} color="#ffffff" />
      <FootballMesh
        position={[0, 0, 0]}
        scale={0.85}
        spinSpeed={0.5}
        opacity={0.97}
        velocity={[0, 0]}
        bounds={{ width: 4, height: 4 }}
      />
    </Canvas>
  );
}
