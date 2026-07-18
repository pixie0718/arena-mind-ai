import { describe, expect, test } from "vitest";
import { venueAgent } from "@/ai/agents/venue.agent";
import { makeRequest } from "@/ai/agents/test-helpers";

describe("venueAgent", () => {
  test("finds a real facility for a recognized facility type", async () => {
    const response = await venueAgent.handle(
      makeRequest("where is the prayer room", { intent: "venue" }),
    );
    expect(response.requiresClarification).toBe(false);
    expect(response.toolCalls).toHaveLength(1);
  });

  // Regression test for a real bug found in live QA: an unrelated message
  // ("Can I bring my dog?", no facility keyword) still called the facility
  // tool, which returns EVERY facility when no type is given — so
  // facilities[0] got presented as a confident (but totally irrelevant)
  // answer. The fix gates the tool call behind an actually-detected type.
  test("asks for clarification instead of guessing a facility for an unrelated message", async () => {
    const response = await venueAgent.handle(
      makeRequest("Can I bring my dog into the stadium?", { intent: "venue" }),
    );
    expect(response.requiresClarification).toBe(true);
    expect(response.toolCalls).toHaveLength(0);
  });

  test("does not call the facility tool at all when no type was detected (regression)", async () => {
    const response = await venueAgent.handle(makeRequest("hello", { intent: "venue" }));
    expect(response.toolCalls).toHaveLength(0);
  });

  test("automatically prefers accessible facilities for a wheelchair user, without asking again", async () => {
    const request = makeRequest("where is the restroom", {
      intent: "venue",
      context: {
        ...makeRequest("x").context,
        accessibility: {
          wheelchair: true,
          largeText: false,
          highContrast: false,
          voiceFirst: false,
        },
      },
    });
    const response = await venueAgent.handle(request);
    const toolCall = response.toolCalls[0];
    expect((toolCall.input as { type?: string }).type).toBe("restroom");
  });
});
