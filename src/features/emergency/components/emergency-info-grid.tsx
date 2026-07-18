"use client";

import { memo } from "react";
import { MapPin, Clock, DoorOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { EmergencyResolvedPayload } from "@/features/emergency/types/emergency-metadata.types";

interface EmergencyInfoGridProps {
  metadata: EmergencyResolvedPayload;
}

function EmergencyInfoGridImpl({ metadata }: EmergencyInfoGridProps) {
  const seatBits = [metadata.location.row && `Row ${metadata.location.row}`, metadata.location.seat && `Seat ${metadata.location.seat}`]
    .filter(Boolean)
    .join(", ");

  const tiles = [
    {
      icon: MapPin,
      label: "Your Location",
      value: seatBits ? `${metadata.location.sectionLabel} — ${seatBits}` : metadata.location.sectionLabel,
    },
    {
      icon: Clock,
      label: "Nearest Medical Team",
      value: `${metadata.nearestMedicalTeam.name} · ${metadata.nearestMedicalTeam.etaMinutes} min`,
    },
    {
      icon: DoorOpen,
      label: "Nearest Exit",
      value: `${metadata.nearestExit.label} (Gate ${metadata.nearestExit.gate})`,
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {tiles.map((tile) => (
        <Card
          key={tile.label}
          size="sm"
          className="border-white/10 border-l-2 border-l-destructive/60 bg-card/70 backdrop-blur-xl"
        >
          <CardContent className="flex items-start gap-2">
            <tile.icon className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden="true" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{tile.label}</span>
              <span className="truncate text-xs font-medium text-foreground">{tile.value}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export const EmergencyInfoGrid = memo(EmergencyInfoGridImpl);
