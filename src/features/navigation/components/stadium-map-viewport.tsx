"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { MapTarget } from "@/features/navigation/types/map-state.types";
import {
  computeZoomTowardPoint,
  computeDoubleClickZoom,
  computeDragConstraints,
  parseViewBox,
} from "@/features/navigation/utils/focus-math";
import type { UseStadiumMapControllerResult } from "@/features/navigation/hooks/use-stadium-map-controller";

interface StadiumMapViewportProps {
  svgMarkup: string;
  viewBox: string;
  sectionLabels: Map<string, string>;
  gateLabels: Map<string, string>;
  focusedTarget: MapTarget | null;
  /** Visual-only secondary highlight — never moves the camera. */
  secondaryTarget?: MapTarget | null;
  controller: UseStadiumMapControllerResult;
  /** Fires when a visitor picks a section directly on the map (click or keyboard activate). */
  onSectionSelect?: (sectionId: string) => void;
}

const WHEEL_SENSITIVITY = 0.0015;

/**
 * The one intentionally "gnarly" component in this feature: raw SVG
 * markup is injected via `dangerouslySetInnerHTML` (trusted, build-time
 * authored asset) so individual sections become real DOM nodes that can
 * be measured (`getBBox()`) and interacted with — something an `<img
 * src>` can't offer and Canvas/Leaflet/Google Maps were explicitly ruled
 * out for. Everything else in the feature stays declarative.
 */
export function StadiumMapViewport({
  svgMarkup,
  viewBox,
  sectionLabels,
  gateLabels,
  focusedTarget,
  secondaryTarget = null,
  controller,
  onSectionSelect,
}: StadiumMapViewportProps) {
  const { scale, x, y, containerRef, svgHostRef, focusSection, focusGate, zoomIn, zoomOut, resetToOverview } =
    controller;
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartDistance = useRef<number | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  const parsedViewBox = useMemo(() => {
    try {
      return parseViewBox(viewBox);
    } catch {
      return { x: 0, y: 0, width: 1000, height: 700 };
    }
  }, [viewBox]);

  // Memoized so the object reference only changes when the markup string
  // actually does. React's diffing for `dangerouslySetInnerHTML` compares
  // this wrapper object by reference, not the inner string — an inline
  // `{ __html: svgMarkup }` literal is a *new* object every render, so
  // every re-render (e.g. the drag-constraints effect below calling
  // setState on each animation frame during a zoom) would otherwise wipe
  // and re-inject the whole SVG, destroying the accessibility attributes
  // the layout effect just set on the section/gate elements.
  const svgHtml = useMemo(() => ({ __html: svgMarkup }), [svgMarkup]);

  // Injection + accessibility wiring (role/tabIndex/aria-label per section+gate node).
  useLayoutEffect(() => {
    const host = svgHostRef.current;
    if (!host) return;

    const svgRoot = host.querySelector("svg");
    if (svgRoot) {
      // Not `role="img"` — the sections/gates below are real focusable
      // buttons, and ARIA forbids interactive descendants of an image.
      // `group` is the standard role for a graphic that bundles controls.
      svgRoot.setAttribute("role", "group");
      svgRoot.setAttribute("focusable", "false");
      svgRoot.setAttribute("aria-label", "Stadium map");
    }

    host.querySelectorAll<SVGElement>("[data-section-id],[data-gate-id]").forEach((el) => {
      const sectionId = el.getAttribute("data-section-id");
      const gateId = el.getAttribute("data-gate-id");
      const label = sectionId
        ? (sectionLabels.get(sectionId) ?? `Section ${sectionId}`)
        : (gateLabels.get(gateId ?? "") ?? `Gate ${gateId}`);
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-label", label);
    });
  }, [svgMarkup, sectionLabels, gateLabels, svgHostRef]);

  // Highlight state — cheap, only toggles classes, doesn't re-walk the whole tree.
  useEffect(() => {
    const host = svgHostRef.current;
    if (!host) return;

    host.querySelectorAll(".is-focused").forEach((el) => {
      el.classList.remove("is-focused");
      el.removeAttribute("aria-pressed");
    });

    if (!focusedTarget) {
      setLiveMessage("Showing full stadium overview.");
      return;
    }

    const selector =
      focusedTarget.kind === "section"
        ? `[data-section-id="${focusedTarget.id}"]`
        : `[data-gate-id="${focusedTarget.id}"]`;
    const el = host.querySelector(selector);
    if (!el) return;

    el.classList.add("is-focused");
    el.setAttribute("aria-pressed", "true");
    const label =
      focusedTarget.kind === "section"
        ? (sectionLabels.get(focusedTarget.id) ?? `Section ${focusedTarget.id}`)
        : (gateLabels.get(focusedTarget.id) ?? `Gate ${focusedTarget.id}`);
    setLiveMessage(`Now viewing ${label}.`);
  }, [focusedTarget, sectionLabels, gateLabels, svgHostRef]);

  // Secondary highlight — visual only, independent of the primary
  // focus/camera pass above. Used by the Emergency card to mark the
  // nearest gate alongside the camera-focused seat section.
  useEffect(() => {
    const host = svgHostRef.current;
    if (!host) return;

    host.querySelectorAll(".is-secondary").forEach((el) => el.classList.remove("is-secondary"));

    if (!secondaryTarget) return;

    const selector =
      secondaryTarget.kind === "section"
        ? `[data-section-id="${secondaryTarget.id}"]`
        : `[data-gate-id="${secondaryTarget.id}"]`;
    const el = host.querySelector(selector);
    if (!el) return;

    el.classList.add("is-secondary");
    const label =
      secondaryTarget.kind === "section"
        ? (sectionLabels.get(secondaryTarget.id) ?? `Section ${secondaryTarget.id}`)
        : (gateLabels.get(secondaryTarget.id) ?? `Gate ${secondaryTarget.id}`);
    setLiveMessage(`Nearest exit highlighted: ${label}.`);
    // Depend on the primitive kind/id, not the `secondaryTarget` object
    // reference: callers (e.g. EmergencyCard) pass a new `{ kind, id }`
    // literal every render, which previously re-ran this effect on every
    // render and, combined with the old `prev => prev + ...` append,
    // produced an ever-growing "Nearest exit highlighted" live-region message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondaryTarget?.kind, secondaryTarget?.id, sectionLabels, gateLabels, svgHostRef]);

  // Drag bounds must adapt as scale changes (gesture-driven, not just programmatic focus).
  useEffect(() => {
    function recompute() {
      const size = containerRef.current
        ? { width: containerRef.current.clientWidth, height: containerRef.current.clientHeight }
        : { width: 0, height: 0 };
      setDragConstraints(computeDragConstraints(scale.get(), parsedViewBox, size));
    }
    recompute();
    const unsubscribe = scale.on("change", recompute);
    window.addEventListener("resize", recompute);
    return () => {
      unsubscribe();
      window.removeEventListener("resize", recompute);
    };
  }, [scale, parsedViewBox, containerRef]);

  function activateFromElement(target: EventTarget | null) {
    if (!(target instanceof Element)) return;
    const sectionEl = target.closest("[data-section-id]");
    if (sectionEl) {
      const sectionId = sectionEl.getAttribute("data-section-id")!;
      focusSection(sectionId);
      onSectionSelect?.(sectionId);
      return;
    }
    const gateEl = target.closest("[data-gate-id]");
    if (gateEl) focusGate(gateEl.getAttribute("data-gate-id")!);
  }

  function getPointerPos(event: { clientX: number; clientY: number }) {
    const rect = containerRef.current?.getBoundingClientRect();
    return rect ? { x: event.clientX - rect.left, y: event.clientY - rect.top } : { x: 0, y: 0 };
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    activateFromElement(event.target);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activateFromElement(event.target);
      return;
    }
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomIn();
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      zoomOut();
    } else if (event.key === "0" || event.key === "Escape") {
      event.preventDefault();
      resetToOverview();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      x.set(x.get() + 40);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      x.set(x.get() - 40);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      y.set(y.get() + 40);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      y.set(y.get() - 40);
    }
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const point = getPointerPos(event);
    const next = computeZoomTowardPoint(
      { scale: scale.get(), x: x.get(), y: y.get() },
      point,
      scale.get() * (1 - event.deltaY * WHEEL_SENSITIVITY),
    );
    scale.set(next.scale);
    x.set(next.x);
    y.set(next.y);
  }

  function handleDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
    const point = getPointerPos(event);
    const next = computeDoubleClickZoom({ scale: scale.get(), x: x.get(), y: y.get() }, point);
    scale.set(next.scale);
    x.set(next.x);
    y.set(next.y);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const midpoint = getPointerPos({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });

      if (pinchStartDistance.current == null) {
        pinchStartDistance.current = distance;
        return;
      }
      const ratio = distance / pinchStartDistance.current;
      pinchStartDistance.current = distance;
      const next = computeZoomTowardPoint(
        { scale: scale.get(), x: x.get(), y: y.get() },
        midpoint,
        scale.get() * ratio,
      );
      scale.set(next.scale);
      x.set(next.x);
      y.set(next.y);
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchStartDistance.current = null;
  }

  return (
    <div
      ref={containerRef}
      className="stadium-map-viewport relative h-full w-full touch-none overflow-hidden rounded-2xl bg-muted/30"
      tabIndex={0}
      role="application"
      aria-label="Interactive stadium map. Use arrow keys to pan, plus and minus to zoom, zero to reset."
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <motion.div
        ref={svgHostRef}
        drag
        dragConstraints={dragConstraints}
        dragElastic={0.05}
        dragMomentum={false}
        className="stadium-svg-host"
        style={{ x, y, scale, transformOrigin: "0 0", width: "100%", height: "100%" }}
        dangerouslySetInnerHTML={svgHtml}
      />
      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
    </div>
  );
}
