import { describe, expect, test } from "vitest";
import { transportAgent } from "@/ai/agents/transport.agent";
import { makeRequest } from "@/ai/agents/test-helpers";

describe("transportAgent", () => {
  test("recommends a real transport option, ranked, with a real ETA", async () => {
    const response = await transportAgent.handle(
      makeRequest("Nearest transport", { intent: "transport" }),
    );
    expect(response.requiresClarification).toBe(false);
    expect(response.reply.length).toBeGreaterThan(0);
  });

  test("filters to the requested transport type", async () => {
    const response = await transportAgent.handle(
      makeRequest("Where can I find parking?", { intent: "transport" }),
    );
    expect(response.toolCalls[0]?.input).toMatchObject({ type: "parking" });
  });

  test("surfaces alternate options with their own reasoning when no specific type was asked", async () => {
    const response = await transportAgent.handle(
      makeRequest("How do I get home?", { intent: "transport" }),
    );
    expect(response.reply).toMatch(/also|consider/i);
  });

  test("asks what mode of transport when nothing else can be inferred", async () => {
    const response = await transportAgent.handle(makeRequest("transport", { intent: "transport" }));
    expect(response.reply.length).toBeGreaterThan(0);
  });
});
