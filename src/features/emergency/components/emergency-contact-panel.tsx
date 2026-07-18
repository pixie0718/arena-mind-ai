"use client";

import { Info } from "lucide-react";
import type { EmergencyResolvedPayload } from "@/features/emergency/types/emergency-metadata.types";

interface EmergencyContactPanelProps {
  metadata: EmergencyResolvedPayload;
}

export function EmergencyContactPanel({ metadata }: EmergencyContactPanelProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-card/50 px-3.5 py-2.5 text-xs text-muted-foreground">
      <p>{metadata.contactInstructions}</p>
      <p className="flex items-start gap-1.5 text-secondary">
        <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
        {metadata.routingExplanation}
      </p>
    </div>
  );
}
