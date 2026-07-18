import type { z } from "zod";

/**
 * Every tool returns this envelope so agents and the response validator
 * can reason about grounding uniformly, regardless of which knowledge
 * collection produced the data. `source` should always point at a
 * knowledge base collection (see docs/AI-Architecture/04-Knowledge-Base.md)
 * — never "model knowledge" — to keep responses non-hallucinated.
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  source: string;
}

export interface ToolContext {
  sessionId: string;
  stadiumId: string;
  language?: string;
}

/**
 * Contract every tool in `src/tools/` must satisfy. Tools are pure,
 * side-effect-free reads against the local knowledge base (or, for
 * translation, a small demo phrasebook) — they never call an LLM
 * themselves.
 *
 * `execute` intentionally takes `unknown` input, not a generic `TInput`.
 * Tool input will eventually arrive as untyped JSON from an LLM's function
 * call, so every tool is responsible for validating it against its own
 * `inputSchema` at the top of `execute` (`inputSchema.parse(input)`).
 * This also keeps the type heterogeneous — a registry holding many
 * differently-shaped tools stays assignable to `ToolDefinition[]` because
 * only the output type varies, and return types are covariant.
 */
export interface ToolDefinition<TOutput = unknown> {
  /** Unique name used for registry lookup and (later) LLM function calling. */
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  execute: (input: unknown, context: ToolContext) => Promise<ToolResult<TOutput>>;
}
