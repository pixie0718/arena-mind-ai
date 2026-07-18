import { z } from "zod";
import type { ToolContext, ToolDefinition, ToolResult } from "@/types/tool";
import {
  getStadiumConfig,
  findStadiumSection,
  listStadiumSectionSuggestions,
} from "@/lib/stadium-config";
import type { StadiumSectionConfig } from "@/types/stadium-config";

const inputSchema = z.object({
  stadiumId: z.string(),
  sectionId: z.string().optional(),
});

export type EmergencyDispatchInput = z.infer<typeof inputSchema>;

/**
 * A pure grounded-data lookup — no category awareness. Category-specific
 * wording (acknowledgement text, instructions, action buttons) lives
 * entirely in `emergency.agent.ts`, keeping this tool a dumb, reusable,
 * testable lookup like every other tool in this directory.
 */
export type EmergencyDispatchResult =
  | {
      status: "section_known";
      section: StadiumSectionConfig;
      nearestMedicalLabel: string;
      nearestExitLabel: string;
      etaMinutes: number;
    }
  | { status: "section_not_found"; query: string; suggestions: { id: string; label: string }[] }
  | { status: "stadium_only"; stadiumName: string }
  | { status: "unsupported_stadium"; stadiumId: string };

async function execute(
  rawInput: unknown,
  _context: ToolContext,
): Promise<ToolResult<EmergencyDispatchResult>> {
  const input = inputSchema.parse(rawInput ?? {});
  const config = await getStadiumConfig(input.stadiumId);

  if (!config) {
    return {
      success: false,
      data: { status: "unsupported_stadium", stadiumId: input.stadiumId },
      error: `No stadium map for "${input.stadiumId}".`,
      source: "stadium-config",
    };
  }

  if (input.sectionId) {
    const section = await findStadiumSection(input.stadiumId, input.sectionId);
    if (section) {
      // Emergency responders are assumed faster than a visitor's own
      // walking pace — a simple, deterministic, honest derivation from
      // the section's real walking time, not a fabricated number.
      const etaMinutes = Math.max(2, section.walkingTimeMinutes - 1);
      return {
        success: true,
        data: {
          status: "section_known",
          section,
          nearestMedicalLabel:
            section.nearby.medical ??
            "the nearest medical point — a nearby volunteer can direct you",
          nearestExitLabel: section.nearby.exit ?? `Gate ${section.gate}`,
          etaMinutes,
        },
        source: "stadium-config",
      };
    }
    return {
      success: false,
      data: {
        status: "section_not_found",
        query: input.sectionId,
        suggestions: await listStadiumSectionSuggestions(input.stadiumId),
      },
      error: `Section ${input.sectionId} isn't in ${config.name}.`,
      source: "stadium-config",
    };
  }

  return {
    success: true,
    data: { status: "stadium_only", stadiumName: config.name },
    source: "stadium-config",
  };
}

export const emergencyTool: ToolDefinition<EmergencyDispatchResult> = {
  name: "emergency_dispatch",
  description:
    "Resolves the nearest medical team, exit, and ETA for a stadium section during an emergency.",
  inputSchema,
  execute,
};
