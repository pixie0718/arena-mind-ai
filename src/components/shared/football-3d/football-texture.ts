import * as THREE from "three";

function drawPentagon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = rotation + (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Procedurally draws a classic pentagon-pattern football texture onto an
 * offscreen canvas — no network asset needed, so it works fully offline
 * and can't 404. Client-only (uses `document`); only ever called from
 * inside `football-mesh.tsx`, which is loaded behind a `next/dynamic`
 * `ssr: false` boundary.
 *
 * Every pentagon shares the same rotation and a regular brick-offset
 * grid — an earlier version rotated each pentagon by a different amount,
 * which read as random blotches rather than a recognizable ball pattern
 * once rendered small on a rotating sphere.
 */
export function createFootballTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f8f7f2";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#181b22";
  const rows = 4;
  const pentRadius = size * 0.11;
  for (let row = 0; row < rows; row++) {
    const y = (size / rows) * (row + 0.5);
    const cols = 3;
    const colWidth = size / cols;
    const offsetX = row % 2 === 0 ? 0 : colWidth / 2;
    for (let col = 0; col < cols; col++) {
      const x = (colWidth * (col + 0.5) + offsetX) % size;
      drawPentagon(ctx, x, y, pentRadius, 0);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}
