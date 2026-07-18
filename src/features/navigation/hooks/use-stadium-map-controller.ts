"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { useMotionValue, useReducedMotion, animate, type MotionValue } from "framer-motion";
import type { MapLevel, MapTarget } from "@/features/navigation/types/map-state.types";
import {
  computeFocusTransform,
  computeStepZoom,
  parseViewBox,
  OVERVIEW_TRANSFORM,
  type Rect,
} from "@/features/navigation/utils/focus-math";

export interface UseStadiumMapControllerResult {
  level: MapLevel;
  focusedTarget: MapTarget | null;
  scale: MotionValue<number>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  containerRef: RefObject<HTMLDivElement | null>;
  svgHostRef: RefObject<HTMLDivElement | null>;
  focusSection: (sectionId: string) => void;
  focusGate: (gateId: string) => void;
  resetToOverview: () => void;
  showSeatDetail: () => void;
  backToSection: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

/**
 * Owns the map's zoom/pan/level state for one `StadiumMap` instance.
 * `scale`/`x`/`y` are Framer Motion motion values (not `useState`) so
 * drag/wheel/pinch gestures update the DOM directly every frame without
 * triggering a React re-render — `level`/`focusedTarget` genuinely need
 * re-renders (they drive which sub-panels mount) and stay as plain state.
 */
export function useStadiumMapController(viewBox: string): UseStadiumMapControllerResult {
  const scale = useMotionValue(OVERVIEW_TRANSFORM.scale);
  const x = useMotionValue(OVERVIEW_TRANSFORM.x);
  const y = useMotionValue(OVERVIEW_TRANSFORM.y);
  const [level, setLevel] = useState<MapLevel>("overview");
  const [focusedTarget, setFocusedTarget] = useState<MapTarget | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgHostRef = useRef<HTMLDivElement>(null);
  const bboxCache = useRef(new Map<string, Rect>());
  const shouldReduceMotion = useReducedMotion();

  const parsedViewBox = useMemo<Rect>(() => {
    try {
      return parseViewBox(viewBox);
    } catch {
      return { x: 0, y: 0, width: 1000, height: 700 };
    }
  }, [viewBox]);

  const animateTo = useCallback(
    (transform: { scale: number; x: number; y: number }) => {
      const transition = shouldReduceMotion
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 300, damping: 32 };
      animate(scale, transform.scale, transition);
      animate(x, transform.x, transition);
      animate(y, transform.y, transition);
    },
    [scale, x, y, shouldReduceMotion],
  );

  const getContainerSize = useCallback(() => {
    const el = containerRef.current;
    return el ? { width: el.clientWidth, height: el.clientHeight } : { width: 0, height: 0 };
  }, []);

  const focusById = useCallback(
    (id: string, kind: "section" | "gate") => {
      const cacheKey = `${kind}:${id}`;
      let rect = bboxCache.current.get(cacheKey);

      if (!rect) {
        const selector = kind === "section" ? `[data-section-id="${id}"]` : `[data-gate-id="${id}"]`;
        const el = svgHostRef.current?.querySelector<SVGGraphicsElement>(selector);
        if (!el) return;
        const bbox = el.getBBox();
        rect = { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
        bboxCache.current.set(cacheKey, rect);
      }

      const transform = computeFocusTransform(rect, parsedViewBox, getContainerSize());
      animateTo(transform);
      setFocusedTarget({ kind, id });
      setLevel("section");
    },
    [animateTo, getContainerSize, parsedViewBox],
  );

  const focusSection = useCallback((sectionId: string) => focusById(sectionId, "section"), [focusById]);
  const focusGate = useCallback((gateId: string) => focusById(gateId, "gate"), [focusById]);

  const resetToOverview = useCallback(() => {
    animateTo(OVERVIEW_TRANSFORM);
    setFocusedTarget(null);
    setLevel("overview");
  }, [animateTo]);

  const showSeatDetail = useCallback(() => {
    setLevel((prev) => (prev === "overview" ? prev : "seat"));
  }, []);

  const backToSection = useCallback(() => {
    setLevel((prev) => (prev === "seat" ? "section" : prev));
  }, []);

  const zoomIn = useCallback(() => {
    const size = getContainerSize();
    const point = { x: size.width / 2, y: size.height / 2 };
    animateTo(computeStepZoom({ scale: scale.get(), x: x.get(), y: y.get() }, point, "in"));
  }, [animateTo, getContainerSize, scale, x, y]);

  const zoomOut = useCallback(() => {
    const size = getContainerSize();
    const point = { x: size.width / 2, y: size.height / 2 };
    const next = computeStepZoom({ scale: scale.get(), x: x.get(), y: y.get() }, point, "out");
    animateTo(next);
    if (next.scale <= 1.01) {
      setFocusedTarget(null);
      setLevel("overview");
    }
  }, [animateTo, getContainerSize, scale, x, y]);

  return {
    level,
    focusedTarget,
    scale,
    x,
    y,
    containerRef,
    svgHostRef,
    focusSection,
    focusGate,
    resetToOverview,
    showSeatDetail,
    backToSection,
    zoomIn,
    zoomOut,
  };
}
