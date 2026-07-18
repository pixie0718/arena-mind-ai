"use client";

import { Siren } from "lucide-react";
import type { EmergencyCategory } from "@/types/intent";

const CATEGORY_LABELS: Record<EmergencyCategory | "unspecified", string> = {
  medical: "Medical Emergency",
  injury: "Injury",
  fire: "Fire",
  security: "Security Threat",
  suspicious_activity: "Suspicious Activity",
  lost_child: "Lost Child",
  crowd: "Crowd Crush",
  volunteer_request: "Volunteer Requested",
  wheelchair_assistance: "Wheelchair Assistance",
  unspecified: "Emergency Assistance",
};

interface EmergencyHeaderBannerProps {
  category: EmergencyCategory | "unspecified";
}

/**
 * `role="alert"` gives this an implicit `aria-live="assertive"` +
 * `aria-atomic="true"` — deliberately separate from the map viewport's own
 * `aria-live="polite"` pan/zoom announcer, so this urgent banner isn't
 * drowned out by (or drowns out) routine map chatter.
 */
export function EmergencyHeaderBanner({ category }: EmergencyHeaderBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
        <Siren className="size-4" aria-hidden="true" />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
          Emergency Assistance
        </span>
        <span className="text-sm font-semibold text-foreground">{CATEGORY_LABELS[category]}</span>
      </div>
    </div>
  );
}
