import "server-only";

// Importing the tool registry triggers its composition-root side effect
// (registering every concrete tool). Anything that calls `processMessage`
// needs this to have run first.
import "@/ai/tool-registry";

export { processMessage, prepareTurn, finalizeTurn, AGENT_REGISTRY } from "@/ai/orchestrator";
export type { OrchestratorInput, OrchestratorOutput, PreparedTurn } from "@/ai/orchestrator";

export { getTool, listTools, hasTool, registerTool } from "@/ai/tool-registry";
export { validateResponse } from "@/ai/response-validator";
export type { ValidationResult } from "@/ai/response-validator";
export { buildPrompt, getSystemPrompt, getAgentPrompt } from "@/ai/prompt-builder";
export type { BuiltPrompt, BuiltPromptMessage, PromptLayers } from "@/ai/prompt-builder";
export { streamGroundedReply, shouldGroundWithLLM } from "@/ai/response-generator";
export type { GroundedStreamParams } from "@/ai/response-generator";
export { buildContext } from "@/ai/context-engine";
export type { ContextEngineInput } from "@/ai/context-engine";
export {
  getMemory,
  appendMessage,
  setActiveIntent,
  setActiveWorkflow,
  setLinkedTicket,
  clearMemory,
} from "@/ai/memory-engine";
export { intentEngine, detectIntent } from "@/ai/intent-engine";

export type * from "@/types/intent";
export type * from "@/types/message";
export type * from "@/types/tool";
export type * from "@/types/agent";
