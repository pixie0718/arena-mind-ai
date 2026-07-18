"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmergencyMetadata } from "@/features/emergency/types/emergency-metadata.types";
import { EmergencyHeaderBanner } from "@/features/emergency/components/emergency-header-banner";
import { EmergencyInfoGrid } from "@/features/emergency/components/emergency-info-grid";
import { EmergencyContactPanel } from "@/features/emergency/components/emergency-contact-panel";
import { EmergencyActionButtons } from "@/features/emergency/components/emergency-action-buttons";
import { EmergencyLocationUnknown } from "@/features/emergency/components/emergency-location-unknown";

/**
 * `ssr:false` for the same reason as `NavigationMapCard`'s dynamic import
 * of `StadiumMap`: `dangerouslySetInnerHTML` + `getBBox()` + pointer/drag
 * gestures are DOM/window APIs with zero SSR benefit.
 */
const StadiumMap = dynamic(
  () => import("@/features/navigation/components/stadium-map").then((mod) => mod.StadiumMap),
  { ssr: false, loading: () => <Skeleton className="h-[220px] rounded-2xl" /> },
);

interface EmergencyCardProps {
  metadata: EmergencyMetadata;
  onSuggestedAction?: (prompt: string) => void;
}

export function EmergencyCard({ metadata, onSuggestedAction }: EmergencyCardProps) {
  if (metadata.status === "location_unknown") {
    return <EmergencyLocationUnknown metadata={metadata} onSuggestedAction={onSuggestedAction} />;
  }

  return (
    <div className="ml-9 flex max-w-sm flex-col gap-2.5">
      <EmergencyHeaderBanner category={metadata.category} />
      <StadiumMap
        stadiumId={metadata.location.stadiumId}
        initialFocus={{ kind: "section", id: metadata.location.sectionId }}
        secondaryFocus={{ kind: "gate", id: metadata.nearestExit.gate }}
        requested={{ row: metadata.location.row, seatNumber: metadata.location.seat }}
        mapHeightClassName="h-[220px]"
      />
      <EmergencyInfoGrid metadata={metadata} />
      <EmergencyContactPanel metadata={metadata} />
      <EmergencyActionButtons metadata={metadata} onAction={onSuggestedAction} />
    </div>
  );
}
