"use client";

import { Clock, MapPin, Navigation, Users } from "lucide-react";
import type { ToolCallRecord } from "@/types/message";
import type { CrowdLevel } from "@/types/knowledge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  isVendorArray,
  isFacilityArray,
  isTransportOptionArray,
  isRoute,
} from "@/features/chat/utils/tool-result-guards";

interface ToolResultCardProps {
  toolCalls?: ToolCallRecord[];
}

const CROWD_LABEL: Record<CrowdLevel, string> = { low: "Low", moderate: "Moderate", high: "High" };
const CROWD_CLASSES: Record<CrowdLevel, string> = {
  low: "border-primary/30 bg-primary/10 text-primary",
  moderate: "border-secondary/30 bg-secondary/10 text-secondary",
  high: "border-destructive/30 bg-destructive/10 text-destructive",
};

/**
 * Demo crowd-level pill — never implies live sensor data. Title text
 * carries the "demo data" disclosure for anyone inspecting it closely;
 * the label itself stays short so it fits inline in a compact card.
 */
function CrowdBadge({ level }: { level: CrowdLevel }) {
  return (
    <span
      title="Demonstration crowd data"
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
        CROWD_CLASSES[level],
      )}
    >
      <Users className="size-2.5" aria-hidden="true" />
      {CROWD_LABEL[level]}
    </span>
  );
}

/**
 * Renders a small structured card for tool output the guards recognize.
 * Falls through to `null` on anything unrecognized — the reply text
 * always stands on its own, this is a bonus, not a dependency.
 */
export function ToolResultCard({ toolCalls }: ToolResultCardProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  for (const call of toolCalls) {
    const { output } = call;

    if (isVendorArray(output)) {
      return (
        <Card
          size="sm"
          className="ml-9 max-w-xs border-white/10 border-l-2 border-l-primary/60 bg-card/70 backdrop-blur-xl"
        >
          <CardContent className="flex flex-col gap-2">
            {output.slice(0, 2).map((vendor) => (
              <div key={vendor.id} className="flex items-start justify-between gap-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{vendor.name}</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="size-3" /> {vendor.location}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3" /> {vendor.queueEstimateMinutes} min
                  </span>
                  {vendor.crowdLevel && <CrowdBadge level={vendor.crowdLevel} />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      );
    }

    if (isFacilityArray(output)) {
      const nearest = output[0];
      return (
        <Card
          size="sm"
          className="ml-9 max-w-xs border-white/10 border-l-2 border-l-primary/60 bg-card/70 backdrop-blur-xl"
        >
          <CardContent className="flex items-center justify-between gap-3 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-foreground">{nearest.name}</span>
              <span className="text-muted-foreground">
                {nearest.section}, {nearest.floor}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {nearest.crowdLevel && <CrowdBadge level={nearest.crowdLevel} />}
              <MapPin className="size-4 text-secondary" />
            </div>
          </CardContent>
        </Card>
      );
    }

    if (isTransportOptionArray(output)) {
      return (
        <Card
          size="sm"
          className="ml-9 max-w-xs border-white/10 border-l-2 border-l-primary/60 bg-card/70 backdrop-blur-xl"
        >
          <CardContent className="flex flex-col gap-2">
            {output.slice(0, 2).map((option) => (
              <div key={option.id} className="flex items-start justify-between gap-3 text-xs">
                <span className="font-medium text-foreground">{option.name}</span>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3" /> {option.etaMinutes} min
                  </span>
                  {option.crowdLevel && <CrowdBadge level={option.crowdLevel} />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      );
    }

    if (isRoute(output)) {
      return (
        <Card
          size="sm"
          className="ml-9 max-w-xs border-white/10 border-l-2 border-l-primary/60 bg-card/70 backdrop-blur-xl"
        >
          <CardContent className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Navigation className="size-4 shrink-0 text-secondary" />
              <span className="font-medium text-foreground">
                {output.from} → {output.to}
              </span>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
              <Clock className="size-3" /> {output.estimatedMinutes} min
            </span>
          </CardContent>
        </Card>
      );
    }
  }

  return null;
}
