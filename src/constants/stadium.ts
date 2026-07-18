export const DEFAULT_STADIUM_ID = "metlife";

/**
 * The stadiums with a real config in `public/stadiums/`. Kept as a small
 * hand-maintained constant (matching the `QUICK_ACTIONS` convention)
 * rather than discovered dynamically — there's no server endpoint to list
 * `public/` contents from the client, and three is few enough that a
 * constant is simpler than building one.
 */
export const STADIUMS: { id: string; name: string }[] = [
  { id: "metlife", name: "MetLife Stadium" },
  { id: "hardrock", name: "Hard Rock Stadium" },
  { id: "azteca", name: "Estadio Azteca" },
];
