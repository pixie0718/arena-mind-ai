import type { AgentDefinition, AgentRequest, AgentResponse } from "@/types/agent";
import { getStadium, getUpcomingMatch } from "@/lib/knowledge";

/**
 * The Match Agent reads directly from the knowledge base rather than a
 * registered tool. Match lookup is a single, unfiltered read (no
 * search/filter surface like food or facilities), so a dedicated tool
 * would add indirection without benefit — see
 * docs/AI-Architecture/02-AI-Architecture.md.
 */
async function handle(request: AgentRequest): Promise<AgentResponse> {
  const match = getUpcomingMatch(request.context.stadiumId);
  const stadium = getStadium(request.context.stadiumId);

  if (!match || !stadium) {
    return {
      agentId: "match",
      reply: "I don't have match information for this stadium yet.",
      toolCalls: [],
      suggestedActions: [],
      requiresClarification: false,
    };
  }

  return {
    agentId: "match",
    reply: `${match.homeTeam} vs ${match.awayTeam} (${match.competition}) kicks off at ${match.kickoff} on ${match.date} at ${stadium.name}.`,
    toolCalls: [],
    suggestedActions: [
      { label: "Find my seat", prompt: "Take me to my seat." },
      { label: "Check transport options", prompt: "What's the fastest way home?" },
    ],
    requiresClarification: false,
  };
}

export const matchAgent: AgentDefinition = {
  id: "match",
  name: "Match Agent",
  description: "Answers questions about the current match, schedule, and venue.",
  tools: [],
  handle,
};
