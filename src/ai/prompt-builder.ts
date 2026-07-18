import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { IntentType } from "@/types/intent";
import type { AssistantContext } from "@/types/agent";
import type { ChatMessage } from "@/types/message";

const PROMPTS_DIR = join(process.cwd(), "src", "ai", "prompts");

/**
 * Maps an intent to its domain prompt file. Intents without a dedicated
 * prompt (e.g. "match", "lost_found") fall back to the system prompt
 * alone — their agents don't need extra behavioral instructions beyond
 * the base persona.
 */
const AGENT_PROMPT_FILES: Partial<Record<IntentType, string>> = {
  navigation: "navigation.md",
  food: "food.md",
  emergency: "emergency.md",
  translation: "translation.md",
  venue: "venue.md",
  transport: "transport.md",
};

const promptCache = new Map<string, string>();

function readPromptFile(filename: string): string {
  const cached = promptCache.get(filename);
  if (cached) return cached;

  const content = readFileSync(join(PROMPTS_DIR, filename), "utf-8");
  promptCache.set(filename, content);
  return content;
}

export function getSystemPrompt(): string {
  return readPromptFile("system.md");
}

export function getAgentPrompt(intent: IntentType): string | null {
  const file = AGENT_PROMPT_FILES[intent];
  return file ? readPromptFile(file) : null;
}

export interface PromptLayers {
  system: string;
  agent: string | null;
  contextSummary: string;
  knowledgeSummary: string;
  userMessage: string;
}

export interface BuiltPromptMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface BuiltPrompt {
  layers: PromptLayers;
  /** Flattened, ready to hand directly to an LLM chat completion call. */
  messages: BuiltPromptMessage[];
}

function summarizeContext(context: AssistantContext): string {
  const lines = [
    `Stadium: ${context.stadiumId}`,
    `Language: ${context.language}`,
    context.linkedTicket
      ? `Seat: Block ${context.linkedTicket.block}, Row ${context.linkedTicket.row}, Seat ${context.linkedTicket.seat}`
      : "Seat: not linked",
  ];

  if (context.accessibility.wheelchair) lines.push("Accessibility: wheelchair user");
  if (context.accessibility.voiceFirst) lines.push("Accessibility: prefers voice-first responses");

  return lines.join("\n");
}

/**
 * Builds the five-layer prompt documented in
 * docs/AI-Architecture/02-AI-Architecture.md → Prompt Architecture:
 *
 *   System Prompt → Agent Prompt → Context Prompt → Knowledge → User Message
 *
 * Does not call any model — purely assembles the payload a future
 * `streamText()` / Responses API call would consume.
 */
export function buildPrompt(params: {
  intent: IntentType;
  context: AssistantContext;
  knowledgeSummary: string;
  userMessage: string;
  history: ChatMessage[];
}): BuiltPrompt {
  const system = getSystemPrompt();
  const agent = getAgentPrompt(params.intent);
  const contextSummary = summarizeContext(params.context);

  const layers: PromptLayers = {
    system,
    agent,
    contextSummary,
    knowledgeSummary: params.knowledgeSummary,
    userMessage: params.userMessage,
  };

  const systemContent = [
    system,
    agent,
    `Context:\n${contextSummary}`,
    `Knowledge:\n${params.knowledgeSummary}`,
  ]
    .filter((section): section is string => Boolean(section))
    .join("\n\n---\n\n");

  const historyMessages: BuiltPromptMessage[] = params.history.slice(-10).map((message) => ({
    role:
      message.role === "tool" ? "assistant" : message.role === "system" ? "system" : message.role,
    content: message.content,
  }));

  return {
    layers,
    messages: [
      { role: "system", content: systemContent },
      ...historyMessages,
      { role: "user", content: params.userMessage },
    ],
  };
}

/**
 * `messages` is consumed exactly as built here by `ai/response-generator.ts`,
 * which passes it straight into the Vercel AI SDK's `streamText()` call —
 * see `streamGroundedReply`. The tool registry's Zod schemas are
 * deliberately never attached as model function-calling tools: every tool
 * call is decided by deterministic agent logic, not by the LLM, so the
 * model only ever sees already-computed results, never a live tool it
 * could invoke itself.
 */
