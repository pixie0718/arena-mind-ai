import type {
  ChatStreamDonePayload,
  ChatStreamFrame,
} from "@/features/chat/types/chat-stream.types";

export class ChatServiceError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ChatServiceError";
    this.status = status;
  }
}

export interface StreamChatMessageParams {
  sessionId: string;
  text: string;
  language?: string;
  stadiumId?: string;
  signal?: AbortSignal;
}

export interface StreamChatMessageHandlers {
  onChunk: (text: string) => void;
  onDone: (payload: ChatStreamDonePayload) => void;
}

/**
 * POSTs to `/api/chat` and consumes the NDJSON response stream, dispatching
 * each frame to the matching handler. Throws `ChatServiceError` on a
 * non-OK response or an `error` frame.
 */
export async function streamChatMessage(
  params: StreamChatMessageParams,
  handlers: StreamChatMessageHandlers,
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: params.sessionId,
      text: params.text,
      language: params.language,
      stadiumId: params.stadiumId,
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ChatServiceError(
      body?.error ?? `Request failed (${response.status}).`,
      response.status,
    );
  }

  if (!response.body) {
    throw new ChatServiceError("Empty response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      const frame = JSON.parse(line) as ChatStreamFrame;
      if (frame.type === "chunk") {
        handlers.onChunk(frame.text);
      } else if (frame.type === "done") {
        handlers.onDone(frame.payload);
      } else {
        throw new ChatServiceError(frame.message);
      }
    }
  }
}
