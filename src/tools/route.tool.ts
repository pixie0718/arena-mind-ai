import { z } from "zod";
import type { ToolContext, ToolDefinition, ToolResult } from "@/types/tool";
import { findRoute } from "@/lib/knowledge";
import type { Route } from "@/types/knowledge";

const inputSchema = z.object({
  stadiumId: z.string().optional(),
  from: z.string().optional(),
  to: z.string(),
});

export type RouteLookupInput = z.infer<typeof inputSchema>;

async function execute(
  rawInput: unknown,
  context: ToolContext,
): Promise<ToolResult<Route>> {
  const input = inputSchema.parse(rawInput);
  const route = findRoute(input.stadiumId ?? context.stadiumId, input.to);

  if (!route) {
    return {
      success: false,
      error: `No route found to "${input.to}".`,
      source: "knowledge/routes",
    };
  }

  return { success: true, data: route, source: "knowledge/routes" };
}

export const routeTool: ToolDefinition<Route> = {
  name: "route",
  description: "Returns turn-by-turn walking directions between two points inside a stadium.",
  inputSchema,
  execute,
};
