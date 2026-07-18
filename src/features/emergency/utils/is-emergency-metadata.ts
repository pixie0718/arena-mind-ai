import type { EmergencyMetadata } from "@/features/emergency/types/emergency-metadata.types";

export function isEmergencyMetadata(value: unknown): value is EmergencyMetadata {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return record.kind === "emergency" && typeof record.status === "string";
}
