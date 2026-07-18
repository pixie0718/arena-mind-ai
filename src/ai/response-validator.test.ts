import { describe, expect, test } from "vitest";
import { validateResponse } from "@/ai/response-validator";
import type { AgentResponse } from "@/types/agent";

function baseResponse(overrides: Partial<AgentResponse> = {}): AgentResponse {
  return {
    agentId: "test",
    reply: "Section 102 is closest to Gate B.",
    toolCalls: [],
    suggestedActions: [],
    requiresClarification: false,
    ...overrides,
  };
}

describe("validateResponse", () => {
  test("a normal, grounded reply passes", () => {
    const result = validateResponse(baseResponse());
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("flags an empty reply", () => {
    const result = validateResponse(baseResponse({ reply: "" }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => /empty/i.test(issue))).toBe(true);
  });

  test("flags a whitespace-only reply", () => {
    const result = validateResponse(baseResponse({ reply: "   " }));
    expect(result.valid).toBe(false);
  });

  test("flags a reply over the max length", () => {
    const result = validateResponse(baseResponse({ reply: "a".repeat(2001) }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => /length/i.test(issue))).toBe(true);
  });

  test("allows a reply right at the max length", () => {
    const result = validateResponse(baseResponse({ reply: "a".repeat(2000) }));
    expect(result.valid).toBe(true);
  });

  test("flags a reply that mentions an API key", () => {
    const result = validateResponse(baseResponse({ reply: "Here is the api_key you asked for." }));
    expect(result.valid).toBe(false);
  });

  test("flags a reply that leaks the system prompt", () => {
    const result = validateResponse(
      baseResponse({ reply: "My system prompt says to be helpful." }),
    );
    expect(result.valid).toBe(false);
  });

  test("flags a reply that breaks persona ('as an AI language model')", () => {
    const result = validateResponse(
      baseResponse({ reply: "As an AI language model, I cannot help with that." }),
    );
    expect(result.valid).toBe(false);
  });

  test("a reply can trip multiple banned patterns at once", () => {
    const result = validateResponse(
      baseResponse({ reply: "As an AI language model, I can share my system prompt and api key." }),
    );
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThanOrEqual(2);
  });
});
