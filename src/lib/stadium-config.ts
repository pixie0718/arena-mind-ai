import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  stadiumConfigSchema,
  type StadiumConfig,
  type StadiumSectionConfig,
} from "@/types/stadium-config";

/**
 * Deliberately NOT a static `import` of each stadium's JSON, unlike every
 * collection in `src/lib/knowledge.ts`. Reading from disk at request time
 * is what makes "drop a JSON file in public/stadiums/, no code changes"
 * literally true on the server side too — a static import would still
 * need a new `import` line + registry entry per stadium. Cached in
 * memory (including negative lookups, so a typo'd stadiumId doesn't hit
 * the filesystem on every message).
 */
const cache = new Map<string, StadiumConfig | null>();

export async function getStadiumConfig(stadiumId: string): Promise<StadiumConfig | undefined> {
  if (cache.has(stadiumId)) return cache.get(stadiumId) ?? undefined;

  const filePath = path.join(process.cwd(), "public", "stadiums", `${stadiumId}.json`);
  try {
    const raw = await readFile(filePath, "utf-8");
    const parsed = stadiumConfigSchema.parse(JSON.parse(raw));
    cache.set(stadiumId, parsed);
    return parsed;
  } catch {
    cache.set(stadiumId, null);
    return undefined;
  }
}

export async function findStadiumSection(
  stadiumId: string,
  sectionId: string,
): Promise<StadiumSectionConfig | undefined> {
  const config = await getStadiumConfig(stadiumId);
  return config?.sections.find((section) => section.id === sectionId);
}

export async function listStadiumSectionSuggestions(
  stadiumId: string,
  limit = 6,
): Promise<{ id: string; label: string }[]> {
  const config = await getStadiumConfig(stadiumId);
  return (config?.sections ?? []).slice(0, limit).map((section) => ({
    id: section.id,
    label: section.label,
  }));
}

export async function isKnownGate(stadiumId: string, gate: string): Promise<boolean> {
  const config = await getStadiumConfig(stadiumId);
  const normalized = gate.toUpperCase();
  return !!config?.gates.some((g) => g.toUpperCase() === normalized);
}
