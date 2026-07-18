"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { accessibilityPreferencesAtom } from "@/store/session";
import { useStadiumConfig } from "@/features/navigation/hooks/use-stadium-config";
import { useStadiumMapController } from "@/features/navigation/hooks/use-stadium-map-controller";
import { fetchSvgMarkup } from "@/features/navigation/services/fetch-svg-markup";
import { StadiumMapViewport } from "@/features/navigation/components/stadium-map-viewport";
import { StadiumMapControls } from "@/features/navigation/components/stadium-map-controls";
import { SectionInfoPanel } from "@/features/navigation/components/section-info-panel";
import { RecommendationCardGrid } from "@/features/navigation/components/recommendation-card-grid";
import { NavigationEmptyState } from "@/features/navigation/components/navigation-empty-state";
import { NavigationErrorState } from "@/features/navigation/components/navigation-error-state";
import type { MapTarget } from "@/features/navigation/types/map-state.types";

interface StadiumMapProps {
  stadiumId?: string;
  initialFocus?: MapTarget;
  /**
   * A second point highlighted purely visually — it does NOT move the
   * camera (only `initialFocus` does). Used by the Emergency card to mark
   * the nearest gate/exit alongside the camera-focused seat section.
   */
  secondaryFocus?: MapTarget;
  requested?: { row?: string; seatNumber?: string };
  /** Height of the map viewport itself — the card as a whole grows below it to fit recommendation cards. */
  mapHeightClassName?: string;
  /** Fires when a visitor taps a section directly on the map. */
  onSectionSelect?: (sectionId: string) => void;
}

export function StadiumMap({
  stadiumId,
  initialFocus,
  secondaryFocus,
  requested,
  mapHeightClassName = "h-[260px]",
  onSectionSelect,
}: StadiumMapProps) {
  const { config, status, errorMessage } = useStadiumConfig(stadiumId);
  const accessibility = useAtomValue(accessibilityPreferencesAtom);
  const controller = useStadiumMapController(config?.viewBox ?? "0 0 1000 700");
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [svgError, setSvgError] = useState<string | null>(null);
  const hasAutoFocusedRef = useRef(false);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    fetchSvgMarkup(config.svgUrl)
      .then((markup) => {
        if (!cancelled) setSvgMarkup(markup);
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setSvgError(error instanceof Error ? error.message : "Could not load map artwork.");
      });
    return () => {
      cancelled = true;
    };
  }, [config]);

  useEffect(() => {
    if (!svgMarkup || !initialFocus || hasAutoFocusedRef.current) return;
    hasAutoFocusedRef.current = true;
    const hasSeatDetail = !!(requested?.row || requested?.seatNumber);
    const raf = requestAnimationFrame(() => {
      if (initialFocus.kind === "section") controller.focusSection(initialFocus.id);
      else controller.focusGate(initialFocus.id);
      if (hasSeatDetail) controller.showSeatDetail();
    });
    return () => cancelAnimationFrame(raf);
  }, [svgMarkup, initialFocus, requested, controller]);

  const sectionLabels = useMemo(() => {
    const map = new Map<string, string>();
    config?.sections.forEach((section) =>
      map.set(section.id, `${section.label}, Gate ${section.gate}, Level ${section.level}`),
    );
    return map;
  }, [config]);

  const gateLabels = useMemo(() => {
    const map = new Map<string, string>();
    config?.gates.forEach((gate) => map.set(gate, `Gate ${gate}`));
    return map;
  }, [config]);

  const focusedSection = useMemo(() => {
    if (!config || controller.focusedTarget?.kind !== "section") return undefined;
    return config.sections.find((s) => s.id === controller.focusedTarget?.id);
  }, [config, controller.focusedTarget]);

  if (!stadiumId) {
    return (
      <div className={mapHeightClassName}>
        <NavigationEmptyState />
      </div>
    );
  }

  if (status === "loading") {
    return <Skeleton className={cn(mapHeightClassName, "rounded-2xl")} />;
  }

  if (status === "error" || !config) {
    return (
      <div className={mapHeightClassName}>
        <NavigationErrorState
          message={errorMessage ?? "We don't have an interactive map for this stadium yet."}
        />
      </div>
    );
  }

  if (svgError) {
    return (
      <div className={mapHeightClassName}>
        <NavigationErrorState message={svgError} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", accessibility.highContrast && "high-contrast")}>
      <div className={cn(mapHeightClassName, "relative")}>
        {svgMarkup ? (
          <>
            <StadiumMapViewport
              svgMarkup={svgMarkup}
              viewBox={config.viewBox}
              sectionLabels={sectionLabels}
              gateLabels={gateLabels}
              focusedTarget={controller.focusedTarget}
              secondaryTarget={secondaryFocus ?? null}
              controller={controller}
              onSectionSelect={onSectionSelect}
            />
            <StadiumMapControls
              onZoomIn={controller.zoomIn}
              onZoomOut={controller.zoomOut}
              onReset={controller.resetToOverview}
            />
            {controller.level === "seat" && focusedSection && (
              <SectionInfoPanel
                section={focusedSection}
                requested={requested ?? {}}
                onBack={controller.backToSection}
              />
            )}
          </>
        ) : (
          <Skeleton className="h-full w-full rounded-2xl" />
        )}
      </div>

      {controller.level !== "overview" && focusedSection && (
        <RecommendationCardGrid
          section={focusedSection}
          wheelchairPreferred={accessibility.wheelchair}
        />
      )}
    </div>
  );
}
