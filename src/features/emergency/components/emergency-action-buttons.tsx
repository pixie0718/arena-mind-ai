"use client";

import { Button } from "@/components/ui/button";
import type { EmergencyResolvedPayload } from "@/features/emergency/types/emergency-metadata.types";

interface EmergencyActionButtonsProps {
  metadata: EmergencyResolvedPayload;
  onAction?: (prompt: string) => void;
}

/**
 * Explicit `min-h-12 min-w-12` (48px) sizing exceeds the design system's
 * default `Button` sizes (32–36px) — a deliberate departure justified by
 * WCAG 2.5.5 and the higher-stakes context (users may be distressed, on a
 * moving/crowded phone).
 */
export function EmergencyActionButtons({ metadata, onAction }: EmergencyActionButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="destructive"
        className="min-h-12 min-w-12 flex-1 px-5 py-3 text-sm font-semibold"
        onClick={() => onAction?.(metadata.primaryAction.prompt)}
      >
        {metadata.primaryAction.label}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="min-h-12 min-w-12 flex-1 px-5 py-3 text-sm font-semibold"
        onClick={() => onAction?.(metadata.secondaryAction.prompt)}
      >
        {metadata.secondaryAction.label}
      </Button>
    </div>
  );
}
