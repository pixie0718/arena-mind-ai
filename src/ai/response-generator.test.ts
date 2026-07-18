import { describe, expect, test } from "vitest";
import {
  shouldGroundWithLLM,
  streamTemplateReply,
  streamGroundedReply,
} from "@/ai/response-generator";
import type { AgentResponse, AssistantContext } from "@/types/agent";

async function collect(stream: AsyncGenerator<string>): Promise<string> {
  let out = "";
  for await (const chunk of stream) out += chunk;
  return out;
}

describe("shouldGroundWithLLM", () => {
  test("is false for emergency — safety-critical facts must never pass through the model", () => {
    expect(shouldGroundWithLLM("emergency")).toBe(false);
  });

  test("is true for every other intent, including 'unknown'", () => {
    expect(shouldGroundWithLLM("unknown")).toBe(true);
    expect(shouldGroundWithLLM("navigation")).toBe(true);
    expect(shouldGroundWithLLM("food")).toBe(true);
    expect(shouldGroundWithLLM("translation")).toBe(true);
    expect(shouldGroundWithLLM("venue")).toBe(true);
    expect(shouldGroundWithLLM("transport")).toBe(true);
    expect(shouldGroundWithLLM("match")).toBe(true);
    expect(shouldGroundWithLLM("lost_found")).toBe(true);
  });
});

describe("streamTemplateReply", () => {
  test("yields the exact original text when every chunk is rejoined", async () => {
    const text = "Section 102 is closest to Gate B.";
    const result = await collect(streamTemplateReply(text));
    expect(result).toBe(text);
  });

  test("yields nothing for empty input", async () => {
    const result = await collect(streamTemplateReply(""));
    expect(result).toBe("");
  });
});

describe("streamGroundedReply — deterministic short-circuit paths", () => {
  const context: AssistantContext = {
    sessionId: "s1",
    stadiumId: "metlife",
    language: "en",
    accessibility: { wheelchair: false, largeText: false, highContrast: false, voiceFirst: false },
    currentTime: new Date(0).toISOString(),
  };

  // Emergency never calls the model at all — this is verifiable without
  // mocking Groq, because the function must short-circuit before ever
  // attempting a network call.
  test("emergency intent streams the template reply verbatim, untouched by any model", async () => {
    const agentResponse: AgentResponse = {
      agentId: "emergency",
      reply:
        "Medical help is being notified. Nearest help: Medical Center North, about 3 min away.",
      toolCalls: [],
      suggestedActions: [],
      requiresClarification: false,
    };
    const result = await collect(
      streamGroundedReply({
        intent: "emergency",
        agentResponse,
        context,
        history: [],
        userMessage: "help",
      }),
    );
    expect(result).toBe(agentResponse.reply);
  });

  // With no GROQ_API_KEY in the test environment, every intent falls back
  // to the same deterministic template path — verifies the assistant is
  // never silent just because a model call was never attempted.
  test("falls back to the template reply verbatim when no API key is configured", async () => {
    const original = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    try {
      const agentResponse: AgentResponse = {
        agentId: "food",
        reply: "Green Bowl Kitchen is your best bet — about 5 min wait.",
        toolCalls: [],
        suggestedActions: [],
        requiresClarification: false,
      };
      const result = await collect(
        streamGroundedReply({
          intent: "food",
          agentResponse,
          context,
          history: [],
          userMessage: "I'm hungry",
        }),
      );
      expect(result).toBe(agentResponse.reply);
    } finally {
      if (original !== undefined) process.env.GROQ_API_KEY = original;
    }
  });
});
