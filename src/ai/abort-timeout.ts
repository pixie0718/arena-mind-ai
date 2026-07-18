/**
 * The same "abort a Groq call after N ms" pattern was hand-written three
 * times (`intent-engine.ts`, `response-generator.ts`,
 * `translation.tool.ts`) — one shared helper instead, so the timeout
 * lifecycle (create, pass the signal, always clear it) can't drift between
 * call sites. Dependency-free like `refusal-detector.ts`, for the same
 * reason: trivial to unit test in isolation.
 */
export interface AbortTimeout {
  readonly signal: AbortSignal;
  /** Always call this once the call it was guarding has settled, success or failure. */
  clear(): void;
}

export function createAbortTimeout(timeoutMs: number): AbortTimeout {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}
