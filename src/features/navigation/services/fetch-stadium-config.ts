import { stadiumConfigSchema, type StadiumConfig } from "@/types/stadium-config";

const cache = new Map<string, Promise<StadiumConfig>>();

/**
 * Fetches `/stadiums/{id}.json` client-side and caches the in-flight/
 * resolved promise per stadiumId for the life of the page — repeated nav
 * cards referencing the same stadium never re-fetch.
 */
export function fetchStadiumConfig(stadiumId: string): Promise<StadiumConfig> {
  const cached = cache.get(stadiumId);
  if (cached) return cached;

  const promise = fetch(`/stadiums/${stadiumId}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`No map config for stadium "${stadiumId}".`);
      return res.json();
    })
    .then((json) => stadiumConfigSchema.parse(json));

  promise.catch(() => cache.delete(stadiumId));
  cache.set(stadiumId, promise);
  return promise;
}
