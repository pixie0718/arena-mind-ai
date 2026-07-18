import "@/ai/tool-registry";
import type { AgentRequest } from "@/types/agent";
import type { ChatMessage } from "@/types/message";

/**
 * Shared factory for agent tests — every agent needs a full `AgentRequest`,
 * and hand-building one per test would duplicate the same boilerplate
 * across every `*.agent.test.ts` file. Importing the tool registry here
 * (a side-effecting module that registers every concrete tool) means any
 * test file that imports from here gets a working `getTool()` for free,
 * the same way `ai/orchestrator.ts` relies on it in the real app.
 */
export function makeMessage(content: string, overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "test-msg",
    role: "user",
    content,
    createdAt: new Date(0).toISOString(),
    ...overrides,
  };
}

export function makeRequest(content: string, overrides: Partial<AgentRequest> = {}): AgentRequest {
  return {
    message: makeMessage(content),
    intent: "navigation",
    context: {
      sessionId: "test-session",
      stadiumId: "metlife",
      language: "en",
      accessibility: {
        wheelchair: false,
        largeText: false,
        highContrast: false,
        voiceFirst: false,
      },
      linkedTicket: null,
      currentTime: new Date(0).toISOString(),
    },
    history: [],
    ...overrides,
  };
}
