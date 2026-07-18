/**
 * The map UI's three zoom levels ("Google Maps for stadiums"). Distinct
 * from the Block → Section → Row → Seat *data* hierarchy described in
 * docs/PRD/08-Functional-Requirements.md (FR-006) — "seat" here means an
 * info overlay on top of the Level 2 view, not further geometric zoom,
 * since no per-seat coordinate data exists or is feasible to author.
 */
export type MapLevel = "overview" | "section" | "seat";

export type MapTarget = { kind: "section"; id: string } | { kind: "gate"; id: string };

export interface FocusTransform {
  scale: number;
  x: number;
  y: number;
}
