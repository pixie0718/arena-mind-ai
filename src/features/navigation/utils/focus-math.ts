export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ContainerSize {
  width: number;
  height: number;
}

export interface Transform {
  scale: number;
  x: number;
  y: number;
}

const DEFAULT_PADDING = 0.18;
const MIN_SCALE = 1;
const MAX_SCALE = 6;
const ZOOM_STEP = 1.5;
const DOUBLE_CLICK_STEP = 1.6;

export const OVERVIEW_TRANSFORM: Transform = { scale: 1, x: 0, y: 0 };

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Parses "minX minY width height" into a Rect. Throws on malformed input. */
export function parseViewBox(viewBox: string): Rect {
  const parts = viewBox.trim().split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Malformed viewBox: "${viewBox}"`);
  }
  const [x, y, width, height] = parts;
  return { x, y, width, height };
}

/**
 * Computes the {scale, x, y} transform (applied as translate(x,y)
 * scale(s)) that fits `target` (in SVG viewBox units) into `container`
 * (css pixels), given the SVG is uniformly fit to the container at
 * scale=1 via `preserveAspectRatio="xMidYMid meet"` (the SVG default).
 */
export function computeFocusTransform(
  target: Rect,
  viewBox: Rect,
  container: ContainerSize,
  padding = DEFAULT_PADDING,
): Transform {
  if (container.width <= 0 || container.height <= 0 || viewBox.width <= 0 || viewBox.height <= 0) {
    return OVERVIEW_TRANSFORM;
  }

  const baseScale = Math.min(container.width / viewBox.width, container.height / viewBox.height);

  const bx = target.x * baseScale;
  const by = target.y * baseScale;
  const bw = target.width * baseScale;
  const bh = target.height * baseScale;

  const paddedW = bw * (1 + 2 * padding);
  const paddedH = bh * (1 + 2 * padding);
  const paddedX = bx - bw * padding;
  const paddedY = by - bh * padding;

  if (paddedW <= 0 || paddedH <= 0) return OVERVIEW_TRANSFORM;

  const scale = clamp(
    Math.min(container.width / paddedW, container.height / paddedH),
    MIN_SCALE,
    MAX_SCALE,
  );

  const cx = paddedX + paddedW / 2;
  const cy = paddedY + paddedH / 2;

  return {
    scale,
    x: container.width / 2 - scale * cx,
    y: container.height / 2 - scale * cy,
  };
}

/** Zoom toward a fixed screen point (wheel/pinch/double-click), keeping that point stationary on screen. */
export function computeZoomTowardPoint(
  current: Transform,
  point: { x: number; y: number },
  nextScale: number,
): Transform {
  const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
  const contentX = (point.x - current.x) / current.scale;
  const contentY = (point.y - current.y) / current.scale;
  return {
    scale,
    x: point.x - contentX * scale,
    y: point.y - contentY * scale,
  };
}

export function computeStepZoom(
  current: Transform,
  point: { x: number; y: number },
  direction: "in" | "out",
): Transform {
  const next = direction === "in" ? current.scale * ZOOM_STEP : current.scale / ZOOM_STEP;
  return computeZoomTowardPoint(current, point, next);
}

export function computeDoubleClickZoom(current: Transform, point: { x: number; y: number }): Transform {
  return computeZoomTowardPoint(current, point, current.scale * DOUBLE_CLICK_STEP);
}

/** Drag/pan bounds so content can't be dragged fully off-screen. */
export function computeDragConstraints(
  scale: number,
  viewBox: Rect,
  container: ContainerSize,
): { left: number; right: number; top: number; bottom: number } {
  if (container.width <= 0 || container.height <= 0 || viewBox.width <= 0 || viewBox.height <= 0) {
    return { left: 0, right: 0, top: 0, bottom: 0 };
  }
  const baseScale = Math.min(container.width / viewBox.width, container.height / viewBox.height);
  const contentW = viewBox.width * baseScale * scale;
  const contentH = viewBox.height * baseScale * scale;
  return {
    left: Math.min(0, container.width - contentW),
    right: 0,
    top: Math.min(0, container.height - contentH),
    bottom: 0,
  };
}

export { MIN_SCALE, MAX_SCALE };
