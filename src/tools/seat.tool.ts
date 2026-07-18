import { z } from "zod";
import type { ToolContext, ToolDefinition, ToolResult } from "@/types/tool";
import { getStadiumConfig, listStadiumSectionSuggestions } from "@/lib/stadium-config";
import type { StadiumSectionConfig } from "@/types/stadium-config";

const inputSchema = z.object({
  sectionId: z.string().optional(),
  row: z.string().optional(),
  seatNumber: z.string().optional(),
  gate: z.string().optional(),
});

export type SectionLookupInput = z.infer<typeof inputSchema>;

export type SectionLookupResult =
  | { status: "found"; section: StadiumSectionConfig; requested: { row?: string; seatNumber?: string } }
  | { status: "gate_found"; gate: string }
  | { status: "unsupported_stadium"; stadiumId: string }
  | { status: "not_found"; query: string; suggestions: { id: string; label: string }[] };

async function execute(
  rawInput: unknown,
  context: ToolContext,
): Promise<ToolResult<SectionLookupResult>> {
  const input = inputSchema.parse(rawInput ?? {});
  const config = await getStadiumConfig(context.stadiumId);

  if (!config) {
    return {
      success: false,
      data: { status: "unsupported_stadium", stadiumId: context.stadiumId },
      error: `Navigation isn't set up for "${context.stadiumId}" yet.`,
      source: "stadium-config",
    };
  }

  if (input.sectionId) {
    const section = config.sections.find((s) => s.id === input.sectionId);
    if (section) {
      return {
        success: true,
        data: { status: "found", section, requested: { row: input.row, seatNumber: input.seatNumber } },
        source: "stadium-config",
      };
    }
    return {
      success: false,
      data: {
        status: "not_found",
        query: input.sectionId,
        suggestions: await listStadiumSectionSuggestions(context.stadiumId),
      },
      error: `Section ${input.sectionId} isn't in ${config.name}.`,
      source: "stadium-config",
    };
  }

  if (input.gate) {
    const normalized = input.gate.toUpperCase();
    if (config.gates.some((g) => g.toUpperCase() === normalized)) {
      return { success: true, data: { status: "gate_found", gate: normalized }, source: "stadium-config" };
    }
    return {
      success: false,
      data: {
        status: "not_found",
        query: input.gate,
        suggestions: config.gates.map((g) => ({ id: g, label: `Gate ${g}` })),
      },
      error: `Gate ${input.gate} isn't in ${config.name}.`,
      source: "stadium-config",
    };
  }

  return {
    success: false,
    data: {
      status: "not_found",
      query: "",
      suggestions: await listStadiumSectionSuggestions(context.stadiumId),
    },
    error: "No section or gate specified.",
    source: "stadium-config",
  };
}

export const seatTool: ToolDefinition<SectionLookupResult> = {
  name: "seat",
  description: "Finds a stadium section or gate and returns its walking time and nearby amenities.",
  inputSchema,
  execute,
};
