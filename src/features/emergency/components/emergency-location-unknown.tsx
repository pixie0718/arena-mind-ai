"use client";

import { EmergencyHeaderBanner } from "@/features/emergency/components/emergency-header-banner";
import { Button } from "@/components/ui/button";
import type { EmergencyLocationUnknownPayload } from "@/features/emergency/types/emergency-metadata.types";

interface EmergencyLocationUnknownProps {
  metadata: EmergencyLocationUnknownPayload;
  onSuggestedAction?: (prompt: string) => void;
}

/**
 * Asks only for the one genuinely missing piece — never re-asks category
 * (already known) or anything else already established.
 */
export function EmergencyLocationUnknown({
  metadata,
  onSuggestedAction,
}: EmergencyLocationUnknownProps) {
  return (
    <div className="ml-9 flex max-w-sm flex-col gap-2.5">
      <EmergencyHeaderBanner category={metadata.category} />
      <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-card/70 px-3.5 py-3 backdrop-blur-xl">
        <p className="text-xs text-muted-foreground">{metadata.instructions}</p>
        <p className="text-xs text-muted-foreground">
          I don&apos;t know your section yet — tell me and I&apos;ll route help directly.
        </p>
        <Button
          type="button"
          variant="destructive"
          className="min-h-12 w-full px-5 py-3 text-sm font-semibold"
          onClick={() => onSuggestedAction?.("Share my current section with responders.")}
        >
          Share My Location
        </Button>
      </div>
    </div>
  );
}
