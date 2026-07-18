"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { NavigationMetadata } from "@/features/navigation/types/navigation-metadata.types";
import { NavigationErrorState } from "@/features/navigation/components/navigation-error-state";

/**
 * `ssr:false` for the same reason as `floating-football-layer.tsx`'s
 * dynamic import of its Three.js layer: `dangerouslySetInnerHTML` +
 * `getBBox()` + pointer/drag gestures are DOM/window APIs with zero SSR
 * benefit, and this keeps the map/gesture code out of the server bundle.
 */
const StadiumMap = dynamic(
  () => import("@/features/navigation/components/stadium-map").then((mod) => mod.StadiumMap),
  { ssr: false, loading: () => <Skeleton className="h-[260px] rounded-2xl" /> },
);

interface NavigationMapCardProps {
  metadata: NavigationMetadata;
  onSuggestedAction?: (prompt: string) => void;
}

export function NavigationMapCard({ metadata, onSuggestedAction }: NavigationMapCardProps) {
  if (metadata.status === "browse") {
    return (
      <div className="ml-9 max-w-sm">
        <StadiumMap
          stadiumId={metadata.stadiumId}
          onSectionSelect={(sectionId) => onSuggestedAction?.(`Section ${sectionId}`)}
        />
      </div>
    );
  }

  if (metadata.status !== "found") {
    const message =
      metadata.status === "unsupported_stadium"
        ? "We don't have an interactive map for this stadium yet."
        : `I couldn't find ${metadata.query ? `"${metadata.query}"` : "that"} in this stadium.`;

    return (
      <div className="ml-9 max-w-sm">
        <NavigationErrorState
          message={message}
          suggestions={metadata.suggestions}
          onSuggestedAction={onSuggestedAction}
          suggestionPrompt={(label) => `Where is ${label}?`}
        />
      </div>
    );
  }

  return (
    <div className="ml-9 max-w-sm">
      <StadiumMap
        stadiumId={metadata.stadiumId}
        initialFocus={{ kind: metadata.target.kind, id: metadata.target.id }}
        requested={metadata.requested}
      />
    </div>
  );
}
