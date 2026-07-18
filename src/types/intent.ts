/**
 * Intent taxonomy for ArenaMind AI.
 *
 * Every value here maps 1:1 to an agent module under `src/ai/agents/`.
 * The Intent Engine only ever needs to know about this list — it never
 * knows how an intent is fulfilled, keeping detection decoupled from
 * execution (see docs/AI-Architecture/02-AI-Architecture.md).
 */
export type IntentType =
  | "navigation"
  | "food"
  | "emergency"
  | "translation"
  | "venue"
  | "transport"
  | "match"
  | "lost_found"
  | "unknown";

export type EmergencyCategory =
  | "medical"
  | "fire"
  | "security"
  | "lost_child"
  | "crowd"
  | "injury"
  | "suspicious_activity"
  | "volunteer_request"
  | "wheelchair_assistance";

export interface DetectedIntent {
  /** The single most likely intent — the orchestrator routes on this. */
  primary: IntentType;
  /** Other intents that also scored, ranked by likelihood. */
  secondary: IntentType[];
  /** 0–1 confidence score for the primary intent. */
  confidence: number;
  /** Only populated when `primary` is "emergency". */
  emergencyCategory?: EmergencyCategory;
  /** The original, unmodified user input. */
  rawInput: string;
}

/**
 * Contract for anything that can classify a message into an intent.
 * The current implementation (`ai/intent-engine.ts`) calls an LLM with a
 * keyword-heuristic fallback for outages/malformed output.
 */
export interface IntentEngine {
  /**
   * `recentContext` is a short, plain-text summary of the last couple of
   * conversation turns (optional). It's used only to resolve an otherwise-
   * ambiguous follow-up ("any update on that?") — see
   * `ai/intent-engine.ts`'s classifier prompt for the exact rule.
   */
  detect(input: string, recentContext?: string): Promise<DetectedIntent>;
}
