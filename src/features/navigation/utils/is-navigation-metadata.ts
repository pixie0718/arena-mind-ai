import type { NavigationMetadata } from "@/features/navigation/types/navigation-metadata.types";

export function isNavigationMetadata(value: unknown): value is NavigationMetadata {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return record.kind === "navigation" && typeof record.status === "string";
}
