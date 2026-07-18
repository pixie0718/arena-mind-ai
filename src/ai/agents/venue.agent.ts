import type { AgentDefinition, AgentRequest, AgentResponse } from "@/types/agent";
import { getTool } from "@/ai/tool-registry";
import type { Facility } from "@/types/knowledge";
import { t } from "@/ai/reply-i18n";

const FACILITY_KEYWORDS: Record<string, Facility["type"]> = {
  restroom: "restroom",
  toilet: "restroom",
  medical: "medical",
  merchandise: "merchandise",
  shop: "merchandise",
  prayer: "prayer_room",
  charging: "charging_station",
  water: "water_station",
  elevator: "elevator",
};

function extractFacilityType(input: string): Facility["type"] | undefined {
  const normalized = input.toLowerCase();
  for (const [keyword, type] of Object.entries(FACILITY_KEYWORDS)) {
    if (normalized.includes(keyword)) return type;
  }
  return undefined;
}

async function handle(request: AgentRequest): Promise<AgentResponse> {
  const facilityTool = getTool("facility");
  const toolCalls: AgentResponse["toolCalls"] = [];
  const type = extractFacilityType(request.message.content);
  const language = request.context.language;

  let facilities: Facility[] = [];
  let reply = t.venueClarify(language);

  // Only look up (and assert) a specific facility once a type was actually
  // identified. Without this guard, an unrelated message (no facility
  // keyword matched, `type` undefined) still called the tool, which
  // returns EVERY facility across every type when `type` is omitted (its
  // documented "browse all" behavior) — so `facilities[0]` got presented
  // as a confident answer to a question that had nothing to do with it.
  if (facilityTool && type) {
    const result = await facilityTool.execute(
      { type, accessibleOnly: request.context.accessibility.wheelchair },
      {
        sessionId: request.context.sessionId,
        stadiumId: request.context.stadiumId,
        language: request.context.language,
      },
    );
    toolCalls.push({ toolName: facilityTool.name, input: { type }, output: result.data });
    facilities = (result.data as Facility[] | undefined) ?? [];
  }

  const nearest = facilities[0];
  if (nearest) {
    reply = t.venueNearest(language, nearest.name, nearest.section, nearest.floor);
    if (facilities.length > 1 && nearest.crowdLevel && nearest.crowdLevel !== "high") {
      reply += ` ${t.venueReasonLowCrowd(language)}`;
    }
  }

  return {
    agentId: "venue",
    reply,
    toolCalls,
    suggestedActions: [],
    requiresClarification: !type,
    clarificationPrompt: !type ? t.venueClarifyPrompt(language) : undefined,
  };
}

export const venueAgent: AgentDefinition = {
  id: "venue",
  name: "Venue Agent",
  description:
    "Helps visitors locate restrooms, medical centers, merchandise, and other facilities.",
  tools: ["facility"],
  handle,
};
