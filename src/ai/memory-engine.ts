import "server-only";
import type { ChatMessage, SessionMemory } from "@/types/message";
import type { IntentType } from "@/types/intent";

/**
 * MVP session memory store.
 *
 * This is an in-memory `Map` scoped to a single server process — it is
 * intentionally simple, matching the "active session only" memory scope
 * documented in docs/AI-Architecture/02-AI-Architecture.md. It will NOT
 * survive a server restart and will NOT be shared across multiple
 * serverless instances. Swap this module's internals for a Redis- or
 * database-backed store before running this in a real multi-instance
 * deployment — the exported function signatures should not need to change.
 */
const store = new Map<string, SessionMemory>();

function createEmptyMemory(sessionId: string): SessionMemory {
  return {
    sessionId,
    messages: [],
    activeIntent: undefined,
    activeWorkflow: undefined,
    linkedTicket: null,
    preferredLanguage: "en",
    updatedAt: new Date().toISOString(),
  };
}

export function getMemory(sessionId: string): SessionMemory {
  const existing = store.get(sessionId);
  if (existing) return existing;

  const fresh = createEmptyMemory(sessionId);
  store.set(sessionId, fresh);
  return fresh;
}

export function appendMessage(sessionId: string, message: ChatMessage): SessionMemory {
  const memory = getMemory(sessionId);
  memory.messages.push(message);
  memory.updatedAt = new Date().toISOString();
  return memory;
}

export function setActiveIntent(sessionId: string, intent: IntentType): void {
  const memory = getMemory(sessionId);
  memory.activeIntent = intent;
  memory.updatedAt = new Date().toISOString();
}

export function setActiveWorkflow(sessionId: string, workflow: string | undefined): void {
  const memory = getMemory(sessionId);
  memory.activeWorkflow = workflow;
  memory.updatedAt = new Date().toISOString();
}

export function setLinkedTicket(sessionId: string, ticket: SessionMemory["linkedTicket"]): void {
  const memory = getMemory(sessionId);
  memory.linkedTicket = ticket;
  memory.updatedAt = new Date().toISOString();
}

export function clearMemory(sessionId: string): void {
  store.delete(sessionId);
}
