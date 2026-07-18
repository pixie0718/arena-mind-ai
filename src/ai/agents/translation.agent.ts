import type { AgentDefinition, AgentRequest, AgentResponse } from "@/types/agent";
import { getTool } from "@/ai/tool-registry";
import type { TranslationResult } from "@/tools/translation.tool";

const LANGUAGE_NAME: Record<string, string> = { es: "Spanish", fr: "French" };

function extractTargetLanguage(input: string): string {
  const match = input.match(/to (spanish|french)/i);
  if (!match) return "es";
  return match[1].toLowerCase() === "french" ? "fr" : "es";
}

/**
 * Users naturally quote the phrase they want translated ("Translate 'Help
 * me' to Spanish") — prefer whatever's inside the quotes so it normalizes
 * to a clean phrasebook key. Falls back to stripping trailing punctuation
 * for the unquoted form ("Translate I need medical help to Spanish").
 */
function extractPhrase(input: string): string {
  const stripped = input.replace(/translate|to (spanish|french)/gi, "").trim();
  const quoted = stripped.match(/['"“‘]([^'"”’]+)['"”’]/);
  if (quoted) return quoted[1].trim();
  return stripped.replace(/[.!?]+$/, "").trim();
}

async function handle(request: AgentRequest): Promise<AgentResponse> {
  const translationTool = getTool("translation");
  const toolCalls: AgentResponse["toolCalls"] = [];
  const targetLanguage = extractTargetLanguage(request.message.content);

  let reply =
    "Tell me what you'd like translated and into which language, and I'll do my best with the phrases I know.";

  if (translationTool) {
    const text = extractPhrase(request.message.content);
    const result = await translationTool.execute(
      { text, targetLanguage },
      {
        sessionId: request.context.sessionId,
        stadiumId: request.context.stadiumId,
        language: request.context.language,
      },
    );
    toolCalls.push({
      toolName: translationTool.name,
      input: { text, targetLanguage },
      output: result.data,
    });

    if (result.success && result.data) {
      const data = result.data as TranslationResult;
      reply = `${LANGUAGE_NAME[targetLanguage] ?? targetLanguage}: "${data.translatedText}"`;
    } else if (result.error) {
      reply = result.error;
    }
  }

  return {
    agentId: "translation",
    reply,
    toolCalls,
    suggestedActions: [],
    requiresClarification: false,
  };
}

export const translationAgent: AgentDefinition = {
  id: "translation",
  name: "Translation Agent",
  description:
    "Translates common visitor and emergency phrases into the visitor's preferred language.",
  tools: ["translation"],
  handle,
};
