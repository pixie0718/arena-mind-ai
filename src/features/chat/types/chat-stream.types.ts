import type { SuggestedAction } from "@/types/agent";
import type { IntentType } from "@/types/intent";
import type { ToolCallRecord } from "@/types/message";

/**
 * Wire format spoken between `src/app/api/chat/route.ts` and
 * `src/features/chat/services/chat.service.ts`. NDJSON (one JSON object
 * per line) rather than SSE — the client reads via `fetch()` +
 * `response.body.getReader()`, not `EventSource`, so SSE framing has no
 * benefit here.
 */
export type ChatStreamFrame =
  | { type: "chunk"; text: string }
  | { type: "done"; payload: ChatStreamDonePayload }
  | { type: "error"; message: string };

export interface ChatStreamDonePayload {
  messageId: string;
  createdAt: string;
  agentId: string | null;
  toolCalls: ToolCallRecord[];
  suggestedActions: SuggestedAction[];
  requiresClarification: boolean;
  clarificationPrompt: string | null;
  metadata: Record<string, unknown> | null;
  intent: IntentType;
}
