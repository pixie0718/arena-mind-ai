import type { Facility, Route, TransportOption, Vendor } from "@/types/knowledge";

/**
 * Cheap runtime guards over the known tool-output shapes from
 * `types/knowledge.ts` / `tools/seat.tool.ts`. `ToolCallRecord.output` is
 * `unknown` at the type level (agents attach whatever their tool
 * returned), so `ToolResultCard` uses these only to decide whether it has
 * something safe to render as a structured card — no match just means the
 * card renders nothing and the reply text stands alone.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isVendorArray(value: unknown): value is Vendor[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.name === "string" &&
        typeof item.location === "string" &&
        typeof item.queueEstimateMinutes === "number" &&
        Array.isArray(item.menu),
    )
  );
}

export function isFacilityArray(value: unknown): value is Facility[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.name === "string" &&
        typeof item.type === "string" &&
        typeof item.floor === "string" &&
        typeof item.section === "string",
    )
  );
}

export function isTransportOptionArray(value: unknown): value is TransportOption[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.name === "string" &&
        typeof item.etaMinutes === "number" &&
        typeof item.notes === "string",
    )
  );
}

export function isRoute(value: unknown): value is Route {
  return (
    isRecord(value) &&
    typeof value.from === "string" &&
    typeof value.to === "string" &&
    typeof value.estimatedMinutes === "number" &&
    Array.isArray(value.steps)
  );
}
