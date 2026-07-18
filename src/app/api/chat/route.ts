import "server-only";
import { z } from "zod";
import { NextResponse } from "next/server";
import { prepareTurn, finalizeTurn, streamGroundedReply } from "@/ai";
import { streamTemplateReply } from "@/ai/response-generator";
import type { ChatStreamFrame } from "@/features/chat/types/chat-stream.types";

const chatRequestSchema = z.object({
  sessionId: z.string().trim().min(1, "sessionId is required"),
  text: z.string().trim().min(1, "text is required").max(2000),
  language: z.string().trim().min(1).optional(),
  stadiumId: z.string().trim().min(1).optional(),
});

const INITIAL_TYPING_DELAY_MS = 350;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const { sessionId, text, language, stadiumId } = parsed.data;

  let prepared;
  try {
    prepared = await prepareTurn({
      sessionId,
      text,
      context: language || stadiumId ? { language, stadiumId } : undefined,
      // (language || stadiumId) — either one present is enough to build a context object;
      // both are individually optional on ContextEngineInput.
    });
  } catch (error) {
    console.error("[api/chat] prepareTurn failed", error);
    return NextResponse.json(
      { error: "The assistant hit a snag processing that. Please try again." },
      { status: 500 },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(frame: ChatStreamFrame) {
        controller.enqueue(encoder.encode(`${JSON.stringify(frame)}\n`));
      }

      try {
        await sleep(INITIAL_TYPING_DELAY_MS);

        let fullText = "";

        // Three cases: (1) a valid agent response streams a grounded LLM
        // rewrite of its real facts; (2) unknown intent (no agent ran —
        // greetings/small talk/unclear messages) still gets a grounded LLM
        // reply, but grounded in the fixed capability list instead of tool
        // facts, so "hey" gets a natural greeting instead of a canned
        // "I didn't understand" line; (3) a validation failure stays
        // strictly template-only — the model never sees text that already
        // failed a safety check.
        const textStream = !prepared.agentResponse
          ? streamGroundedReply({
              intent: "unknown",
              agentResponse: {
                agentId: "unknown",
                reply: prepared.fallbackReplyText,
                toolCalls: [],
                suggestedActions: [],
                requiresClarification: false,
              },
              context: prepared.context,
              history: prepared.history,
              userMessage: text,
            })
          : prepared.validation?.valid
            ? streamGroundedReply({
                intent: prepared.detected.primary,
                agentResponse: prepared.agentResponse,
                context: prepared.context,
                history: prepared.history,
                userMessage: text,
              })
            : streamTemplateReply(prepared.fallbackReplyText);

        for await (const chunk of textStream) {
          fullText += chunk;
          send({ type: "chunk", text: chunk });
        }

        const message = finalizeTurn(prepared, fullText || prepared.fallbackReplyText);

        send({
          type: "done",
          payload: {
            messageId: message.id,
            createdAt: message.createdAt,
            agentId: prepared.agentResponse?.agentId ?? null,
            toolCalls: message.toolCalls ?? [],
            suggestedActions: prepared.agentResponse?.suggestedActions ?? [],
            requiresClarification: prepared.agentResponse?.requiresClarification ?? false,
            clarificationPrompt: prepared.agentResponse?.clarificationPrompt ?? null,
            metadata: prepared.agentResponse?.metadata ?? null,
            intent: prepared.detected.primary,
          },
        });
      } catch {
        send({ type: "error", message: "Streaming was interrupted." });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
