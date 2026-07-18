import type { IntentType } from "@/types/intent";

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface ToolCallRecord {
  toolName: string;
  input: unknown;
  output: unknown;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  toolCalls?: ToolCallRecord[];
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  sessionId: string;
  messages: ChatMessage[];
}

/**
 * Session-scoped conversational memory owned by the Memory Engine.
 * Mirrors the "Memory Scope (MVP)" section in
 * docs/AI-Architecture/02-AI-Architecture.md — active session only,
 * no cross-session persistence in the MVP.
 */
export interface SessionMemory {
  sessionId: string;
  messages: ChatMessage[];
  activeIntent?: IntentType;
  /** Name of an in-progress multi-turn workflow, e.g. "lost_found_report". */
  activeWorkflow?: string;
  linkedTicket?: {
    stadiumId: string;
    block: string;
    row: string;
    seat: string;
  } | null;
  preferredLanguage: string;
  updatedAt: string;
}
