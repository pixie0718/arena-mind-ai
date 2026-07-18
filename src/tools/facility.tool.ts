import { z } from "zod";
import type { ToolContext, ToolDefinition, ToolResult } from "@/types/tool";
import { getFacilities } from "@/lib/knowledge";
import type { Facility } from "@/types/knowledge";
import { byCrowdThen } from "@/ai/reply-i18n";

const inputSchema = z.object({
  type: z
    .enum([
      "restroom",
      "medical",
      "merchandise",
      "prayer_room",
      "charging_station",
      "water_station",
      "elevator",
    ])
    .optional(),
  accessibleOnly: z.boolean().optional(),
});

export type FacilitySearchInput = z.infer<typeof inputSchema>;

async function execute(rawInput: unknown, context: ToolContext): Promise<ToolResult<Facility[]>> {
  const input = inputSchema.parse(rawInput ?? {});
  let facilities = getFacilities(context.stadiumId);

  if (input.type) {
    facilities = facilities.filter((facility) => facility.type === input.type);
  }
  if (input.accessibleOnly) {
    facilities = facilities.filter((facility) => facility.accessible);
  }

  facilities = [...facilities].sort(byCrowdThen(() => 0));

  return { success: true, data: facilities, source: "knowledge/facilities" };
}

export const facilityTool: ToolDefinition<Facility[]> = {
  name: "facility",
  description:
    "Finds venue facilities such as restrooms, medical centers, and charging stations, ranked by lowest crowd level.",
  inputSchema,
  execute,
};
