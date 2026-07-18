import "server-only";
import { z } from "zod";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import type { ToolContext, ToolDefinition, ToolResult } from "@/types/tool";

const inputSchema = z.object({
  text: z.string(),
  targetLanguage: z.string(),
});

export type TranslationInput = z.infer<typeof inputSchema>;

export interface TranslationResult {
  sourceText: string;
  targetLanguage: string;
  translatedText: string;
  isDemoTranslation: boolean;
}

const TARGET_LANGUAGE_NAME: Record<string, string> = { es: "Spanish", fr: "French" };

const TRANSLATION_MODEL = groq("openai/gpt-oss-120b");
const LLM_TIMEOUT_MS = 6000;

const TRANSLATOR_SYSTEM_PROMPT = `You are a precise phrase translator for ArenaMind AI, a live in-stadium
assistant. Translate the visitor's exact phrase into the requested target
language. Preserve proper nouns, gate numbers, section numbers, and names
unchanged. Do not add explanations, greetings, or extra sentences — return
ONLY the translated phrase, nothing else.`;

/**
 * Real-time translation via Groq, supporting arbitrary phrases (not just a
 * fixed list). Returns `null` (never throws) on any failure — missing key,
 * timeout, network error — so the caller can fall back to the small demo
 * phrasebook below and the assistant keeps working through a model outage.
 */
async function translateWithGroq(text: string, targetLanguageName: string): Promise<string | null> {
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), LLM_TIMEOUT_MS);

  try {
    const { text: translated } = await generateText({
      model: TRANSLATION_MODEL,
      system: TRANSLATOR_SYSTEM_PROMPT,
      prompt: `Translate this phrase into ${targetLanguageName}:\n\n${text}`,
      abortSignal: timeoutController.signal,
      // See the matching comment in ai/response-generator.ts — caps the
      // SDK's internal retry cascade so the demo-phrasebook fallback below
      // takes over promptly during a real outage instead of after a long
      // multi-attempt backoff.
      maxRetries: 1,
    });

    const trimmed = translated.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch (error) {
    console.warn("[translation.tool] Groq translation failed, falling back to demo phrasebook:", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Small phrase book kept as an offline fallback for when the model call
 * fails — covers a couple of high-value navigation/emergency phrases so
 * translation still works, non-hallucinated, even during a model outage.
 */
const DEMO_PHRASEBOOK: Record<string, Record<string, string>> = {
  "please move toward gate 2": {
    es: "Por favor, diríjase hacia la Puerta 2.",
    fr: "Veuillez vous diriger vers la Porte 2.",
  },
  "i need medical help": {
    es: "Necesito ayuda médica.",
    fr: "J'ai besoin d'aide médicale.",
  },
  "help me": {
    es: "Ayúdame.",
    fr: "Aidez-moi.",
  },
  "where is the nearest exit": {
    es: "¿Dónde está la salida más cercana?",
    fr: "Où se trouve la sortie la plus proche ?",
  },
};

async function execute(
  rawInput: unknown,
  _context: ToolContext,
): Promise<ToolResult<TranslationResult>> {
  const input = inputSchema.parse(rawInput);
  const trimmedText = input.text.trim();
  const targetLanguageName = TARGET_LANGUAGE_NAME[input.targetLanguage] ?? input.targetLanguage;

  const llmTranslation = trimmedText
    ? await translateWithGroq(trimmedText, targetLanguageName)
    : null;

  if (llmTranslation) {
    return {
      success: true,
      data: {
        sourceText: input.text,
        targetLanguage: input.targetLanguage,
        translatedText: llmTranslation,
        isDemoTranslation: false,
      },
      source: "groq-llm",
    };
  }

  const normalized = trimmedText.toLowerCase();
  const entry = DEMO_PHRASEBOOK[normalized];
  const translatedText = entry?.[input.targetLanguage];

  if (!translatedText) {
    return {
      success: false,
      error: "Translation is temporarily unavailable — please try again in a moment.",
      source: "demo-phrasebook",
    };
  }

  return {
    success: true,
    data: {
      sourceText: input.text,
      targetLanguage: input.targetLanguage,
      translatedText,
      isDemoTranslation: true,
    },
    source: "demo-phrasebook",
  };
}

export const translationTool: ToolDefinition<TranslationResult> = {
  name: "translation",
  description: "Translates arbitrary stadium phrases into a visitor's preferred language via Groq, with a small demo phrasebook fallback.",
  inputSchema,
  execute,
};
