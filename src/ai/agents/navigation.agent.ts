import type { AgentDefinition, AgentRequest, AgentResponse } from "@/types/agent";
import { getTool } from "@/ai/tool-registry";
import { parseSeatQuery } from "@/ai/seat-query-parser";
import type { Facility, Route } from "@/types/knowledge";
import type { SectionLookupResult } from "@/tools/seat.tool";
import type { NavigationMetadata } from "@/features/navigation/types/navigation-metadata.types";
import { t } from "@/ai/reply-i18n";

const FIND_RESTROOM_ACTION = {
  label: "Find nearest restroom",
  prompt: "Where is the nearest restroom?",
};
const FIND_EXIT_ACTION = { label: "Find fastest exit", prompt: "What's the fastest exit?" };
const SELECT_ON_MAP_ACTION = {
  label: "Select on map",
  prompt: "Let me pick my section on the map.",
};

function handleBrowseMapRequest(request: AgentRequest): AgentResponse {
  const metadata: NavigationMetadata = {
    kind: "navigation",
    status: "browse",
    stadiumId: request.context.stadiumId,
  };
  return {
    agentId: "navigation",
    reply: "Sure — tap your section on the map below.",
    toolCalls: [],
    suggestedActions: [FIND_RESTROOM_ACTION, FIND_EXIT_ACTION],
    requiresClarification: false,
    metadata: metadata as unknown as Record<string, unknown>,
  };
}

interface SeatQuery {
  sectionId?: string;
  row?: string;
  seatNumber?: string;
  gate?: string;
}

/** Builds the reply for a resolved section, translating tool output into a grounded response. */
function buildSectionFoundResponse(
  data: Extract<SectionLookupResult, { status: "found" }>,
  query: SeatQuery,
  request: AgentRequest,
  toolCalls: AgentResponse["toolCalls"],
): AgentResponse {
  const seatBits = t.seatBits(request.context.language, query.row, query.seatNumber);
  const hasSeatDetail = Boolean(query.row || query.seatNumber);
  const reply =
    t.navSectionFound(
      request.context.language,
      data.section.label,
      seatBits,
      data.section.gate,
      data.section.walkingTimeMinutes,
    ) + (hasSeatDetail ? "" : t.navAskRowSeat(request.context.language));
  const metadata: NavigationMetadata = {
    kind: "navigation",
    status: "found",
    stadiumId: request.context.stadiumId,
    target: { kind: "section", id: data.section.id, label: data.section.label },
    section: data.section,
    requested: data.requested,
  };
  return {
    agentId: "navigation",
    reply,
    toolCalls,
    suggestedActions: [FIND_RESTROOM_ACTION, FIND_EXIT_ACTION],
    requiresClarification: false,
    metadata: metadata as unknown as Record<string, unknown>,
  };
}

function buildGateFoundResponse(
  data: Extract<SectionLookupResult, { status: "gate_found" }>,
  request: AgentRequest,
  toolCalls: AgentResponse["toolCalls"],
): AgentResponse {
  const metadata: NavigationMetadata = {
    kind: "navigation",
    status: "found",
    stadiumId: request.context.stadiumId,
    target: { kind: "gate", id: data.gate, label: `Gate ${data.gate}` },
    requested: {},
  };
  return {
    agentId: "navigation",
    reply: `Heading to Gate ${data.gate}.`,
    toolCalls,
    suggestedActions: [FIND_RESTROOM_ACTION, FIND_EXIT_ACTION],
    requiresClarification: false,
    metadata: metadata as unknown as Record<string, unknown>,
  };
}

/** Neither found nor gate_found — covers not_found, unsupported_stadium, and a missing tool result alike. */
function buildSeatNotFoundResponse(
  data: SectionLookupResult | undefined,
  query: SeatQuery,
  request: AgentRequest,
  toolCalls: AgentResponse["toolCalls"],
): AgentResponse {
  if (data?.status === "unsupported_stadium") {
    return {
      agentId: "navigation",
      reply:
        "I don't have a map for this stadium yet, so I can't guide you visually — but ask me about restrooms or exits and I'll still help.",
      toolCalls,
      suggestedActions: [],
      requiresClarification: false,
    };
  }

  const suggestions = data?.status === "not_found" ? data.suggestions : [];
  const suggestionText = suggestions.length
    ? ` Did you mean: ${suggestions.map((s) => s.label).join(", ")}?`
    : "";
  const metadata: NavigationMetadata = {
    kind: "navigation",
    status: "not_found",
    stadiumId: request.context.stadiumId,
    query: query.sectionId ?? query.gate,
    reason: query.gate ? "unknown_gate" : "unknown_section",
    suggestions,
  };
  return {
    agentId: "navigation",
    reply: `I couldn't find ${query.sectionId ? `Section ${query.sectionId}` : `Gate ${query.gate}`}.${suggestionText}`,
    toolCalls,
    suggestedActions: [FIND_RESTROOM_ACTION, FIND_EXIT_ACTION],
    requiresClarification: false,
    metadata: metadata as unknown as Record<string, unknown>,
  };
}

async function handleSectionOrGateRequest(request: AgentRequest): Promise<AgentResponse> {
  // Fresh mention in this message always wins — only fall back to a
  // previously linked seat (e.g. "My seat is Section 102...") when this
  // turn doesn't name one itself, mirroring emergency.agent.ts's memory
  // precedence so "Find my gate" doesn't re-ask for a section already on
  // file.
  const freshQuery = parseSeatQuery(request.message.content);
  const linkedTicket = request.context.linkedTicket;
  const query: SeatQuery = {
    sectionId: freshQuery.sectionId ?? linkedTicket?.block ?? undefined,
    row: freshQuery.row ?? linkedTicket?.row ?? undefined,
    seatNumber: freshQuery.seatNumber ?? linkedTicket?.seat ?? undefined,
    gate: freshQuery.gate,
  };
  const toolCalls: AgentResponse["toolCalls"] = [];

  if (!query.sectionId && !query.gate) {
    return {
      agentId: "navigation",
      reply:
        'I can help you find your seat — what\'s your section number? For example, "Section 132" or, if you have it handy, "Section 132, Row F, Seat 18". Or tap "Select on map" below to pick it visually.',
      toolCalls,
      suggestedActions: [SELECT_ON_MAP_ACTION, FIND_RESTROOM_ACTION, FIND_EXIT_ACTION],
      requiresClarification: true,
      clarificationPrompt: "Which section are you in?",
    };
  }

  const seatTool = getTool("seat");
  if (!seatTool) {
    return {
      agentId: "navigation",
      reply: "Seat lookup isn't available right now.",
      toolCalls,
      suggestedActions: [FIND_RESTROOM_ACTION, FIND_EXIT_ACTION],
      requiresClarification: false,
    };
  }

  const ctx = {
    sessionId: request.context.sessionId,
    stadiumId: request.context.stadiumId,
    language: request.context.language,
  };
  const result = await seatTool.execute(query, ctx);
  toolCalls.push({ toolName: seatTool.name, input: query, output: result.data });

  const data = result.data as SectionLookupResult | undefined;

  if (data?.status === "found") return buildSectionFoundResponse(data, query, request, toolCalls);
  if (data?.status === "gate_found") return buildGateFoundResponse(data, request, toolCalls);
  return buildSeatNotFoundResponse(data, query, request, toolCalls);
}

async function handleRestroomRequest(request: AgentRequest): Promise<AgentResponse> {
  const facilityTool = getTool("facility");
  const toolCalls: AgentResponse["toolCalls"] = [];
  let reply =
    "I couldn't find a restroom nearby right now — try asking a volunteer close to your section.";

  if (facilityTool) {
    const result = await facilityTool.execute(
      { type: "restroom", accessibleOnly: request.context.accessibility.wheelchair },
      {
        sessionId: request.context.sessionId,
        stadiumId: request.context.stadiumId,
        language: request.context.language,
      },
    );
    toolCalls.push({
      toolName: facilityTool.name,
      input: { type: "restroom" },
      output: result.data,
    });

    const restrooms = (result.data as Facility[] | undefined) ?? [];
    const nearest = restrooms[0];
    if (nearest) {
      reply = t.navRestroomFound(request.context.language, nearest.section, nearest.floor);
      if (restrooms.length > 1 && nearest.crowdLevel && nearest.crowdLevel !== "high") {
        reply += ` ${t.navRestroomReason(request.context.language)}`;
      }
    }
  }

  return {
    agentId: "navigation",
    reply,
    toolCalls,
    suggestedActions: [FIND_EXIT_ACTION],
    requiresClarification: false,
  };
}

async function handleExitRequest(request: AgentRequest): Promise<AgentResponse> {
  const routeTool = getTool("route");
  const toolCalls: AgentResponse["toolCalls"] = [];
  let reply =
    "I don't have live exit congestion data yet, but any gate you entered through works as an exit.";

  if (routeTool) {
    const result = await routeTool.execute(
      { stadiumId: request.context.stadiumId, to: "exit" },
      {
        sessionId: request.context.sessionId,
        stadiumId: request.context.stadiumId,
        language: request.context.language,
      },
    );
    toolCalls.push({ toolName: routeTool.name, input: { to: "exit" }, output: result.data });

    if (result.success && result.data) {
      const route = result.data as Route;
      reply = `Head toward ${route.from} — about ${route.estimatedMinutes} minutes away.`;
    }
  }

  return {
    agentId: "navigation",
    reply,
    toolCalls,
    suggestedActions: [FIND_RESTROOM_ACTION],
    requiresClarification: false,
  };
}

/**
 * Dispatch order matters: "gate" must be checked before the exit regex,
 * and the exit regex must NOT also match "gate" — otherwise "Take me to
 * Gate B" (a section/gate lookup) would incorrectly hit the exit/route
 * handler instead of the seat tool's gate lookup. Each branch now returns
 * its own final `suggestedActions` — the dispatcher no longer clobbers it
 * after the fact (previously every reply, including a successful seat
 * lookup, had its suggestedActions overwritten with a generic pair).
 */
async function handle(request: AgentRequest): Promise<AgentResponse> {
  const input = request.message.content.toLowerCase();

  // Checked before the general seat/section regex below — "pick my
  // section on the map" would otherwise match `\bsection\b` and loop back
  // into the same "what's your section number?" text clarification the
  // user just asked to skip.
  if (/pick.*(on the )?map|select.*(on the )?map|show.*(the )?map/.test(input)) {
    return handleBrowseMapRequest(request);
  }

  if (/seat|section|find my way|\bgate\b/.test(input)) return handleSectionOrGateRequest(request);
  if (/restroom|toilet|washroom/.test(input)) return handleRestroomRequest(request);
  if (/\bexit\b/.test(input)) return handleExitRequest(request);

  return {
    agentId: "navigation",
    reply:
      "I can help you navigate the stadium — tell me if you're looking for your seat, a restroom, or an exit.",
    toolCalls: [],
    suggestedActions: [FIND_RESTROOM_ACTION, FIND_EXIT_ACTION],
    requiresClarification: false,
  };
}

export const navigationAgent: AgentDefinition = {
  id: "navigation",
  name: "Navigation Agent",
  description:
    "Guides visitors to seats, gates, restrooms, and exits using an interactive stadium map and indoor routing data.",
  tools: ["seat", "route", "facility"],
  handle,
};
