import { z } from "zod";

export const crowdLevelSchema = z.enum(["low", "moderate", "high"]);

/** Configurable demo crowd data — not a real prediction system. See `types/knowledge.ts`'s `CrowdLevel` for the shared concept used across the older knowledge-base types. */
export type CrowdLevel = z.infer<typeof crowdLevelSchema>;

/**
 * A navigable section of a stadium. `id` must match the `data-section-id`
 * attribute on the corresponding shape in that stadium's SVG map — the
 * engine cross-references the two rather than hardcoding geometry here.
 * `level` is a display field (which bowl tier a section is on), distinct
 * from the map UI's own "zoom level" concept (see
 * `src/features/navigation/types/map-state.types.ts`).
 */
export const stadiumSectionConfigSchema = z.object({
  id: z.string(),
  label: z.string(),
  gate: z.string(),
  level: z.number().int(),
  walkingTimeMinutes: z.number().int().positive(),
  accessible: z.boolean(),
  crowdLevel: crowdLevelSchema.optional(),
  nearby: z.object({
    food: z.string().optional(),
    restroom: z.string().optional(),
    exit: z.string().optional(),
    medical: z.string().optional(),
  }),
});

export type StadiumSectionConfig = z.infer<typeof stadiumSectionConfigSchema>;

/**
 * A stadium's navigation config. `viewBox` must exactly match the
 * `viewBox` attribute on `svgUrl`'s root `<svg>` element — the map engine
 * uses it to convert between SVG user-space coordinates and screen
 * pixels without ever parsing the SVG itself for that information.
 */
export const stadiumConfigSchema = z.object({
  stadiumId: z.string(),
  name: z.string(),
  svgUrl: z.string(),
  viewBox: z.string(),
  gates: z.array(z.string()),
  sections: z.array(stadiumSectionConfigSchema),
});

export type StadiumConfig = z.infer<typeof stadiumConfigSchema>;
