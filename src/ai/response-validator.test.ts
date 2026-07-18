import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateResponse } from "./response-validator.ts";
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
    assert.equal(result.valid, true);
    assert.deepEqual(result.issues, []);
  });

  test("flags an empty reply", () => {
    const result = validateResponse(baseResponse({ reply: "" }));
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((issue) => /empty/i.test(issue)));
  });

  test("flags a whitespace-only reply", () => {
    const result = validateResponse(baseResponse({ reply: "   " }));
    assert.equal(result.valid, false);
  });

  test("flags a reply over the max length", () => {
    const result = validateResponse(baseResponse({ reply: "a".repeat(2001) }));
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((issue) => /length/i.test(issue)));
  });

  test("allows a reply right at the max length", () => {
    const result = validateResponse(baseResponse({ reply: "a".repeat(2000) }));
    assert.equal(result.valid, true);
  });

  test("flags a reply that mentions an API key", () => {
    const result = validateResponse(baseResponse({ reply: "Here is the api_key you asked for." }));
    assert.equal(result.valid, false);
  });

  test("flags a reply that leaks the system prompt", () => {
    const result = validateResponse(baseResponse({ reply: "My system prompt says to be helpful." }));
    assert.equal(result.valid, false);
  });

  test("flags a reply that breaks persona ('as an AI language model')", () => {
    const result = validateResponse(
      baseResponse({ reply: "As an AI language model, I cannot help with that." }),
    );
    assert.equal(result.valid, false);
  });

  test("a reply can trip multiple banned patterns at once", () => {
    const result = validateResponse(
      baseResponse({ reply: "As an AI language model, I can share my system prompt and api key." }),
    );
    assert.equal(result.valid, false);
    assert.ok(result.issues.length >= 2);
  });
});
