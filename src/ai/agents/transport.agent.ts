import type { AgentDefinition, AgentRequest, AgentResponse } from "@/types/agent";
import { getTool } from "@/ai/tool-registry";
import type { TransportOption } from "@/types/knowledge";
import { crowdLevelNote, t } from "@/ai/reply-i18n";

const TRANSPORT_KEYWORDS: Record<string, TransportOption["type"]> = {
  metro: "metro",
  train: "metro",
  bus: "bus",
  shuttle: "bus",
  taxi: "taxi",
  uber: "rideshare",
  rideshare: "rideshare",
  parking: "parking",
  walk: "walking",
};

// Rough demo classification, not a real emissions model — used only to
// enrich the reply with a brief, honestly-labeled sustainability note.
const LOW_EMISSION_TYPES = new Set<TransportOption["type"]>(["metro", "bus", "walking"]);
const HIGH_EMISSION_TYPES = new Set<TransportOption["type"]>(["taxi", "rideshare"]);

function extractTransportType(input: string): TransportOption["type"] | undefined {
  const normalized = input.toLowerCase();
  for (const [keyword, type] of Object.entries(TRANSPORT_KEYWORDS)) {
    if (normalized.includes(keyword)) return type;
  }
  return undefined;
}

function sustainabilityNote(option: TransportOption, language: string): string {
  if (LOW_EMISSION_TYPES.has(option.type)) return t.sustainabilityLow(language);
  if (HIGH_EMISSION_TYPES.has(option.type)) return t.sustainabilityHigh(language);
  return "";
}

function reasonFor(option: TransportOption, language: string): string {
  const bits = [option.notes];
  if (option.crowdLevel) bits.push(crowdLevelNote(option.crowdLevel, language));
  const sustainability = sustainabilityNote(option, language);
  if (sustainability) bits.push(sustainability);
  return bits.filter(Boolean).join(" ");
}

async function handle(request: AgentRequest): Promise<AgentResponse> {
  const transportTool = getTool("transport");
  const toolCalls: AgentResponse["toolCalls"] = [];
  const type = extractTransportType(request.message.content);
  const language = request.context.language;

  let options: TransportOption[] = [];
  let reply = t.transportClarify(language);

  if (transportTool) {
    const result = await transportTool.execute(
      { type },
      {
        sessionId: request.context.sessionId,
        stadiumId: request.context.stadiumId,
        language: request.context.language,
      },
    );
    toolCalls.push({ toolName: transportTool.name, input: { type }, output: result.data });
    options = (result.data as TransportOption[] | undefined) ?? [];
  }

  const best = options[0];
  if (best) {
    reply = t.transportBestPick(language, best.name, best.etaMinutes, reasonFor(best, language));

    // No specific mode was asked for — surface the alternates too, each
    // with its own one-line reason, so the visitor can compare modes
    // instead of only ever seeing the single fastest pick.
    const alternates = type ? [] : options.slice(1, 3);
    if (alternates.length > 0) {
      const lines = alternates.map(
        (option) => `- ${option.name} (${option.etaMinutes} min): ${reasonFor(option, language)}`,
      );
      reply += `\n\n${t.transportAlsoConsider(language)}\n${lines.join("\n")}`;
    }
  }

  return {
    agentId: "transport",
    reply,
    toolCalls,
    suggestedActions: options.slice(0, 2).map((option) => ({
      label: option.name,
      prompt: `Tell me more about ${option.name}.`,
    })),
    requiresClarification: false,
  };
}

export const transportAgent: AgentDefinition = {
  id: "transport",
  name: "Transport Agent",
  description: "Recommends parking, metro, taxi, and rideshare options ranked by ETA.",
  tools: ["transport"],
  handle,
};
