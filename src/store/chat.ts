import { atomWithStorage } from "jotai/utils";
import type { ChatMessage } from "@/types/message";
import type { SuggestedAction } from "@/types/agent";

export interface ChatMessageUiMeta {
  agentId?: string | null;
  suggestedActions?: SuggestedAction[];
  requiresClarification?: boolean;
  clarificationPrompt?: string | null;
}

export type ChatUIMessage = ChatMessage & {
  ui?: ChatMessageUiMeta;
  isStreaming?: boolean;
};

/**
 * Single active conversation, persisted to localStorage — mirrors the
 * "Memory Scope (MVP): active session only, no cross-session persistence"
 * note in docs/AI-Architecture/02-AI-Architecture.md. Flat array, not
 * keyed by sessionId: MVP has exactly one active conversation per browser.
 *
 * Distinct from and independent of the server's `ai/memory-engine.ts`
 * Map — that one is ephemeral, process-scoped, and only used for
 * prompt/context building. It is not the source of truth for what the UI
 * renders.
 */
export const chatMessagesAtom = atomWithStorage<ChatUIMessage[]>(
  "arenamind:chat:messages",
  [],
);
