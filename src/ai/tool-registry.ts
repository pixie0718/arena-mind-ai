import "server-only";
import type { ToolDefinition } from "@/types/tool";

const registry = new Map<string, ToolDefinition>();

export function registerTool(tool: ToolDefinition): void {
  if (registry.has(tool.name)) {
    throw new Error(`Tool "${tool.name}" is already registered.`);
  }
  registry.set(tool.name, tool);
}

export function getTool(name: string): ToolDefinition | undefined {
  return registry.get(name);
}

export function listTools(): ToolDefinition[] {
  return Array.from(registry.values());
}

export function hasTool(name: string): boolean {
  return registry.has(name);
}

/**
 * Composition root — the one place that knows every concrete tool
 * implementation. Agents and the orchestrator only ever depend on
 * `getTool`/`listTools`, never on a tool module directly, so adding a new
 * tool means adding one import + one line here, nothing else.
 */
import { seatTool } from "@/tools/seat.tool";
import { routeTool } from "@/tools/route.tool";
import { foodTool } from "@/tools/food.tool";
import { transportTool } from "@/tools/transport.tool";
import { faqTool } from "@/tools/faq.tool";
import { facilityTool } from "@/tools/facility.tool";
import { translationTool } from "@/tools/translation.tool";
import { emergencyTool } from "@/tools/emergency.tool";

[
  seatTool,
  routeTool,
  foodTool,
  transportTool,
  faqTool,
  facilityTool,
  translationTool,
  emergencyTool,
].forEach(registerTool);
