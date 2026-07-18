"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const FootballCanvasLayer = dynamic(
  () => import("@/components/shared/football-3d/football-canvas-layer"),
  { ssr: false },
);

const FootballBadgeCanvas = dynamic(
  () => import("@/components/shared/football-3d/football-badge-canvas"),
  { ssr: false },
);

interface FloatingFootballLayerProps {
  /**
   * `"bottom"` (default) tucks the badge just above the bottom nav bar —
   * safe on every page except chat. `"top"` pins it near the header
   * instead, for the one page (`ChatScreen`) where the bottom is occupied
   * by the message composer, whose height changes (quick-actions row
   * shown/hidden, error banner) in a way a fixed bottom offset can't
   * reliably clear without also drifting away from "near the bottom".
   */
  badgePosition?: "bottom" | "top";
}

/**
 * Two independent decorative layers:
 *
 * 1. A full-viewport ambient sparkle backdrop, `-z-10` (behind all page
 *    content) — fine to be a diffuse, partially-obscured wash since it's
 *    not a single object that needs guaranteed visibility.
 * 2. A single small football "badge" at `z-40` — above normal page
 *    content so it's guaranteed visible on every screen size instead of
 *    only showing through whatever content gap happened to be behind it
 *    (the previous full-viewport-fraction approach: reliable on the one
 *    viewport height it was eyeballed against, invisible on others), but
 *    below the bottom nav's `z-50` so it never overlaps the tab bar.
 */
export function FloatingFootballLayer({ badgePosition = "bottom" }: FloatingFootballLayerProps) {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <FootballCanvasLayer />
      </div>
      <div
        className={cn(
          "pointer-events-none fixed right-4 z-40 size-14",
          badgePosition === "bottom" ? "bottom-20" : "top-20",
        )}
      >
        <FootballBadgeCanvas />
      </div>
    </>
  );
}
