import type { AssistantContext } from "@/types/agent";
import { DEFAULT_STADIUM_ID } from "@/constants/stadium";

export interface ContextEngineInput {
  sessionId: string;
  stadiumId?: string;
  language?: string;
  accessibility?: Partial<AssistantContext["accessibility"]>;
  linkedTicket?: AssistantContext["linkedTicket"];
}

const DEFAULT_ACCESSIBILITY: AssistantContext["accessibility"] = {
  wheelchair: false,
  largeText: false,
  highContrast: false,
  voiceFirst: false,
};

/**
 * Assembles the `AssistantContext` every agent receives. Pure function by
 * design — it never reaches into Jotai atoms or cookies itself. The caller
 * (an API route or Server Action) is responsible for resolving raw session
 * data and passing it in, which keeps this module trivially testable and
 * usable outside of a request/response cycle.
 */
export function buildContext(input: ContextEngineInput): AssistantContext {
  return {
    sessionId: input.sessionId,
    stadiumId: input.stadiumId ?? DEFAULT_STADIUM_ID,
    language: input.language ?? "en",
    accessibility: {
      ...DEFAULT_ACCESSIBILITY,
      ...input.accessibility,
    },
    linkedTicket: input.linkedTicket ?? null,
    currentTime: new Date().toISOString(),
  };
}
