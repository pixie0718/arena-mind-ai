import type { AgentDefinition, AgentRequest, AgentResponse } from "@/types/agent";
import { generateId } from "@/utils/id";

export type LostFoundStatus = "reported" | "searching" | "found" | "closed";

export interface LostFoundReport {
  id: string;
  sessionId: string;
  item: string;
  lastSeenLocation: string;
  status: LostFoundStatus;
  createdAt: string;
}

/**
 * MVP in-memory report store, scoped to the server process — mirrors the
 * Memory Engine's session-scoped approach. A production build would
 * persist this to a database (see docs/PRD/13-Appendix.md → Out of Scope).
 */
const reports: LostFoundReport[] = [];

// "item"/"something"/etc. mean no real item was named ("I lost an item.")
// — never file a report for a placeholder, ask what it actually was.
const GENERIC_ITEM_WORDS = new Set(["item", "something", "stuff", "thing", "things"]);

const COMMON_LOST_ITEMS = ["Phone", "Wallet", "Jacket", "Bag", "Keys"];

function extractItem(input: string): string | undefined {
  const match = input.match(/lost (my |an? )?(.+)/i);
  const raw = match?.[2]?.trim().replace(/[.!?]+$/, "");
  if (!raw || GENERIC_ITEM_WORDS.has(raw.toLowerCase())) return undefined;
  return raw;
}

/**
 * Reuses the same session-linked seat that navigation/emergency already
 * fall back to (`context.linkedTicket`) so a report isn't filed with no
 * idea where the item was lost, when we already know the visitor's seat
 * from earlier in the conversation.
 */
function describeLinkedLocation(
  linkedTicket: AgentRequest["context"]["linkedTicket"],
): string {
  if (!linkedTicket) return "unspecified";
  const parts = [`Section ${linkedTicket.block}`];
  if (linkedTicket.row) parts.push(`Row ${linkedTicket.row}`);
  if (linkedTicket.seat) parts.push(`Seat ${linkedTicket.seat}`);
  return parts.join(", ");
}

async function handle(request: AgentRequest): Promise<AgentResponse> {
  const input = request.message.content.toLowerCase();
  // Broad enough to catch the natural ways visitors actually ask this
  // ("any update on my report?", "did you find it?", "any news?") — the
  // original three-word list missed common phrasings entirely, which
  // silently fell through to the generic "what did you lose?" branch
  // below even when a report already existed for the session.
  const isTrackingRequest =
    /track|status|find my report|update|any news|found (it|my|the)|did you find|has it been found|is there any/.test(
      input,
    );

  if (isTrackingRequest) {
    const existing = [...reports]
      .reverse()
      .find((report) => report.sessionId === request.context.sessionId);

    if (!existing) {
      return {
        agentId: "lost_found",
        reply: "I don't see any lost item reports for this session yet.",
        toolCalls: [],
        suggestedActions: [],
        requiresClarification: false,
      };
    }

    return {
      agentId: "lost_found",
      reply: `Report ${existing.id} for "${existing.item}" (last seen: ${existing.lastSeenLocation}) is currently ${existing.status}.`,
      toolCalls: [],
      suggestedActions: [],
      requiresClarification: false,
    };
  }

  const item = extractItem(request.message.content);
  if (!item) {
    return {
      agentId: "lost_found",
      reply: "I'm sorry to hear that — what did you lose?",
      toolCalls: [],
      suggestedActions: COMMON_LOST_ITEMS.map((thing) => ({
        label: thing,
        prompt: `I lost my ${thing.toLowerCase()}.`,
      })),
      requiresClarification: true,
      clarificationPrompt: "What item did you lose?",
    };
  }

  const lastSeenLocation = describeLinkedLocation(request.context.linkedTicket);
  const report: LostFoundReport = {
    id: generateId("lf"),
    sessionId: request.context.sessionId,
    item,
    lastSeenLocation,
    status: "reported",
    createdAt: request.context.currentTime,
  };
  reports.push(report);

  const locationNote =
    lastSeenLocation === "unspecified"
      ? " I don't have a seat on file for you yet — tell me your section if you'd like it added to the report."
      : ` Logged near ${lastSeenLocation}, based on the seat you shared earlier.`;

  return {
    agentId: "lost_found",
    reply: `I've logged a report for your ${item}. Tracking ID: ${report.id}.${locationNote} I'll let you know if it's found.`,
    toolCalls: [],
    suggestedActions: [{ label: "Track my report", prompt: "Track my lost item report." }],
    requiresClarification: false,
    metadata: { reportId: report.id },
  };
}

export const lostFoundAgent: AgentDefinition = {
  id: "lost_found",
  name: "Lost & Found Agent",
  description: "Creates and tracks lost item reports for the active session.",
  tools: [],
  handle,
};
