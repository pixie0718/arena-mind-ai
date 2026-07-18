import type { EmergencyCategory, IntentType } from "@/types/intent";
import type { ChatMessage } from "@/types/message";

/**
 * Everything an agent (or the prompt builder) knows about the current
 * visitor without needing to re-derive it. Built once per request by the
 * Context Engine (`ai/context-engine.ts`).
 */
export interface AssistantContext {
  sessionId: string;
  stadiumId: string;
  language: string;
  accessibility: {
    wheelchair: boolean;
    largeText: boolean;
    highContrast: boolean;
    voiceFirst: boolean;
  };
  linkedTicket?: {
    stadiumId: string;
    block: string;
    row: string;
    seat: string;
  } | null;
  currentTime: string;
}

export interface AgentRequest {
  message: ChatMessage;
  intent: IntentType;
  /** Only ever set when `intent === "emergency"`. */
  emergencyCategory?: EmergencyCategory;
  context: AssistantContext;
  /** Prior turns in this session, most recent last. */
  history: ChatMessage[];
}

export interface SuggestedAction {
  label: string;
  /** Prompt to send back through the orchestrator if the user taps this. */
  prompt: string;
}

export interface AgentResponse {
  agentId: string;
  reply: string;
  toolCalls: { toolName: string; input: unknown; output: unknown }[];
  suggestedActions: SuggestedAction[];
  requiresClarification: boolean;
  clarificationPrompt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Contract every domain agent under `src/ai/agents/` must satisfy. The
 * orchestrator only ever depends on this interface (Dependency Inversion),
 * so adding a new domain never requires touching the orchestrator's
 * pipeline logic — only its agent registry entry.
 */
export interface AgentDefinition {
  id: IntentType;
  name: string;
  description: string;
  /** Names of tools (from the tool registry) this agent is allowed to call. */
  tools: string[];
  handle: (request: AgentRequest) => Promise<AgentResponse>;
}
