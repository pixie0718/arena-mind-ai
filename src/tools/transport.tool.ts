import { z } from "zod";
import type { ToolContext, ToolDefinition, ToolResult } from "@/types/tool";
import { getTransportOptions } from "@/lib/knowledge";
import type { TransportOption } from "@/types/knowledge";
import { byCrowdThen } from "@/ai/reply-i18n";

const inputSchema = z.object({
  type: z.enum(["metro", "bus", "taxi", "rideshare", "parking", "walking"]).optional(),
});

export type TransportSearchInput = z.infer<typeof inputSchema>;

async function execute(
  rawInput: unknown,
  context: ToolContext,
): Promise<ToolResult<TransportOption[]>> {
  const input = inputSchema.parse(rawInput ?? {});
  const options = getTransportOptions(context.stadiumId);
  const filtered = input.type ? options.filter((option) => option.type === input.type) : options;

  const sorted = [...filtered].sort(byCrowdThen((a, b) => a.etaMinutes - b.etaMinutes));

  return { success: true, data: sorted, source: "knowledge/transport" };
}

export const transportTool: ToolDefinition<TransportOption[]> = {
  name: "transport",
  description:
    "Finds transportation options (metro, bus, taxi, rideshare, parking, walking) ranked by crowd level then ETA.",
  inputSchema,
  execute,
};
