/**
 * How to add a new stadium (e.g. "hardrock"):
 *
 * 1. Author public/stadiums/hardrock.svg — any viewBox, with each
 *    navigable section as a shape carrying data-section-id="<id>" and
 *    each gate marker carrying data-gate-id="<id>". See metlife.svg for
 *    the donut-wedge recipe.
 * 2. Author public/stadiums/hardrock.json matching StadiumConfig
 *    (src/types/stadium-config.ts) — stadiumId must be "hardrock", svgUrl
 *    "/stadiums/hardrock.svg", viewBox must exactly match the SVG's
 *    viewBox attribute, and every section's `id` must exist as a
 *    data-section-id in the SVG (every `gate` value must be listed in the
 *    top-level `gates` array).
 *
 * No React, TypeScript, or build changes are required — getStadiumConfig()
 * (src/lib/stadium-config.ts) reads public/stadiums/{id}.json from disk at
 * request time rather than a static import, and the client fetches the
 * same file + SVG lazily via useStadiumConfig()/fetchSvgMarkup().
 */
export { StadiumMap } from "./components/stadium-map";
export { NavigationMapCard } from "./components/navigation-map-card";
export type { NavigationMetadata } from "./types/navigation-metadata.types";
