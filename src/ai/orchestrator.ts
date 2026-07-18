import "server-only";
import { intentEngine } from "@/ai/intent-engine";
import { buildContext, type ContextEngineInput } from "@/ai/context-engine";
import { appendMessage, getMemory, setActiveIntent, setLinkedTicket } from "@/ai/memory-engine";
import { validateResponse } from "@/ai/response-validator";
import type { ValidationResult } from "@/ai/response-validator";
import { generateId } from "@/utils/id";
import type { AgentDefinition, AgentRequest, AgentResponse, AssistantContext } from "@/types/agent";
import type { ChatMessage, SessionMemory } from "@/types/message";
import type { DetectedIntent, IntentType } from "@/types/intent";
import { t } from "@/ai/reply-i18n";

import { navigationAgent } from "@/ai/agents/navigation.agent";
import { foodAgent } from "@/ai/agents/food.agent";
import { emergencyAgent } from "@/ai/agents/emergency.agent";
import { translationAgent } from "@/ai/agents/translation.agent";
import { venueAgent } from "@/ai/agents/venue.agent";
import { transportAgent } from "@/ai/agents/transport.agent";
import { matchAgent } from "@/ai/agents/match.agent";
import { lostFoundAgent } from "@/ai/agents/lost-found.agent";

/**
 * Agent Router — composition root mapping a detected intent to the agent
 * responsible for handling it. Adding a new domain means adding one entry
 * here plus the corresponding agent module; the pipeline in
 * `processMessage` below never needs to change (Open/Closed Principle).
 */
const AGENT_REGISTRY: Record<Exclude<IntentType, "unknown">, AgentDefinition> = {
  navigation: navigationAgent,
  food: foodAgent,
  emergency: emergencyAgent,
  translation: translationAgent,
  venue: venueAgent,
  transport: transportAgent,
  match: matchAgent,
  lost_found: lostFoundAgent,
};

export interface OrchestratorInput {
  sessionId: string;
  text: string;
  context?: Omit<ContextEngineInput, "sessionId">;
}

export interface OrchestratorOutput {
  message: ChatMessage;
  agentResponse: AgentResponse | null;
  intent: DetectedIntent;
}

/**
 * Structural check for a resolved-location metadata shape — deliberately
 * NOT importing `NavigationMetadata` from `@/features/navigation` here,
 * so the orchestrator stays feature-agnostic. Any agent whose metadata
 * happens to match this shape (kind:"navigation", status:"found", a
 * section target) gets its location persisted to session memory for
 * free, with zero orchestrator changes — this is the informal
 * "resolved-location metadata" convention.
 */
interface ResolvedLocationMetadataShape {
  kind?: string;
  status?: string;
  stadiumId?: string;
  target?: { kind?: string; id?: string };
  section?: { id?: string };
  requested?: { row?: string; seatNumber?: string };
}

function extractLinkedTicket(
  metadata: Record<string, unknown> | undefined,
): SessionMemory["linkedTicket"] | null {
  if (!metadata) return null;
  const m = metadata as ResolvedLocationMetadataShape;
  if (m.kind !== "navigation" || m.status !== "found") return null;
  if (m.target?.kind !== "section" || !m.section?.id || !m.stadiumId) return null;
  return {
    stadiumId: m.stadiumId,
    block: m.section.id,
    row: m.requested?.row ?? "",
    seat: m.requested?.seatNumber ?? "",
  };
}

const RECENT_CONTEXT_TURNS = 2;
const RECENT_CONTEXT_MAX_CHARS = 200;

/**
 * A short, plain-text summary of the last couple of turns — handed to the
 * intent classifier so an ambiguous follow-up ("any update on that?") can
 * be resolved against what was just discussed, without giving the
 * classifier the full conversation. Truncated per-message so one long
 * reply can't blow out the classification prompt.
 */
function summarizeRecentTurns(messages: ChatMessage[]): string | undefined {
  const recent = messages.slice(-RECENT_CONTEXT_TURNS);
  if (recent.length === 0) return undefined;

  return recent
    .map((message) => {
      const content =
        message.content.length > RECENT_CONTEXT_MAX_CHARS
          ? `${message.content.slice(0, RECENT_CONTEXT_MAX_CHARS)}…`
          : message.content;
      return `${message.role}: ${content}`;
    })
    .join("\n");
}

/**
 * Result of the deterministic half of a turn — intent detection, context
 * resolution, agent dispatch, and validation. Nothing here has touched the
 * model that generates final prose, and the assistant message has NOT yet
 * been written to session memory: that happens in `finalizeTurn`, once the
 * caller knows the final reply text (grounded-LLM rewrite or template
 * fallback — see `ai/response-generator.ts`). Splitting these two steps is
 * what lets `/api/chat` stream real model tokens while keeping every
 * business decision (which gate, which vendor, which exit) fully
 * deterministic and pre-computed, per the "LLM never decides facts" rule.
 */
export interface PreparedTurn {
  sessionId: string;
  userMessage: ChatMessage;
  detected: DetectedIntent;
  context: AssistantContext;
  /** `null` only when `detected.primary === "unknown"` — no agent runs. */
  agentResponse: AgentResponse | null;
  validation: ValidationResult | null;
  /** Deterministic, already-correct reply text: template or safe fallback. */
  fallbackReplyText: string;
  /** Session history as of this turn (user message included, assistant not). */
  history: ChatMessage[];
}

/**
 * Runs everything up to (but not including) writing the assistant's reply
 * to memory: intent detection (Groq-backed, keyword fallback), context
 * resolution, agent dispatch, and response validation. Mirrors the flow
 * documented in docs/AI-Architecture/02-AI-Architecture.md through
 * "Validate Response" — the final "Update Session Memory" step happens in
 * `finalizeTurn` instead, once the streamed reply text is known.
 */
export async function prepareTurn(input: OrchestratorInput): Promise<PreparedTurn> {
  const userMessage: ChatMessage = {
    id: generateId("msg"),
    role: "user",
    content: input.text,
    createdAt: new Date().toISOString(),
  };

  const memory = getMemory(input.sessionId);
  const recentContext = summarizeRecentTurns(memory.messages);
  appendMessage(input.sessionId, userMessage);

  const detected = await intentEngine.detect(input.text, recentContext);
  const context = buildContext({
    sessionId: input.sessionId,
    ...input.context,
    // Client-supplied linkedTicket always wins; otherwise fall back to
    // whatever location memory already resolved on an earlier turn (see
    // extractLinkedTicket below) — this is what lets "Someone fainted"
    // know the seat from an earlier "My seat is Section 132..." turn.
    linkedTicket: input.context?.linkedTicket ?? memory.linkedTicket ?? undefined,
  });

  if (detected.primary === "unknown") {
    setActiveIntent(input.sessionId, "unknown");
    return {
      sessionId: input.sessionId,
      userMessage,
      detected,
      context,
      agentResponse: null,
      validation: null,
      fallbackReplyText: t.fallbackUnknownIntent(context.language),
      history: memory.messages,
    };
  }

  setActiveIntent(input.sessionId, detected.primary);
  const agent = AGENT_REGISTRY[detected.primary];

  const request: AgentRequest = {
    message: userMessage,
    intent: detected.primary,
    emergencyCategory: detected.emergencyCategory,
    context,
    history: memory.messages,
  };

  const agentResponse = await agent.handle(request);
  const validation = validateResponse(agentResponse);
  const fallbackReplyText = validation.valid
    ? agentResponse.reply
    : t.fallbackValidationFailed(context.language);

  return {
    sessionId: input.sessionId,
    userMessage,
    detected,
    context,
    agentResponse,
    validation,
    fallbackReplyText,
    history: memory.messages,
  };
}

/**
 * Writes the final assistant reply — whatever text was actually streamed to
 * the client, whether that's the grounded LLM rewrite or the deterministic
 * fallback — to session memory, and resolves any newly-linked seat from the
 * agent's metadata. Must be called exactly once per turn, after streaming
 * completes.
 */
export function finalizeTurn(prepared: PreparedTurn, finalReplyText: string): ChatMessage {
  const resolvedTicket = prepared.agentResponse
    ? extractLinkedTicket(prepared.agentResponse.metadata)
    : null;
  if (resolvedTicket) setLinkedTicket(prepared.sessionId, resolvedTicket);

  const assistantMessage: ChatMessage = {
    id: generateId("msg"),
    role: "assistant",
    content: finalReplyText,
    toolCalls: prepared.agentResponse?.toolCalls,
    metadata: prepared.agentResponse?.metadata,
    createdAt: new Date().toISOString(),
  };
  appendMessage(prepared.sessionId, assistantMessage);
  return assistantMessage;
}

/**
 * Non-streaming convenience wrapper around `prepareTurn` + `finalizeTurn`,
 * using the deterministic template/fallback reply text directly (no LLM
 * rewrite). `/api/chat` no longer uses this — it streams a grounded reply —
 * but this remains useful for tests or any future non-streaming caller.
 */
export async function processMessage(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const prepared = await prepareTurn(input);
  const message = finalizeTurn(prepared, prepared.fallbackReplyText);
  return { message, agentResponse: prepared.agentResponse, intent: prepared.detected };
}

export { AGENT_REGISTRY };
