import { describe, expect, test } from "vitest";
import { matchAgent } from "@/ai/agents/match.agent";
import { makeRequest } from "@/ai/agents/test-helpers";

describe("matchAgent", () => {
  test("reports the real upcoming match and venue for a supported stadium", async () => {
    const response = await matchAgent.handle(makeRequest("what's the score"));
    expect(response.reply).toContain("Argentina");
    expect(response.reply).toContain("Brazil");
    expect(response.reply).toContain("15:00");
    expect(response.reply).toContain("MetLife Stadium");
  });

  test("offers relevant follow-up actions, not generic ones", async () => {
    const response = await matchAgent.handle(makeRequest("what's the score"));
    expect(response.suggestedActions.map((a) => a.label)).toContain("Find my seat");
  });

  test("returns the correct match for a different stadium, never mixing data across venues", async () => {
    const response = await matchAgent.handle(
      makeRequest("score", { context: { ...makeRequest("x").context, stadiumId: "azteca" } }),
    );
    expect(response.reply).toContain("Mexico");
    expect(response.reply).toContain("Canada");
    expect(response.reply).not.toContain("Argentina");
  });

  test("says so honestly instead of guessing when a stadium has no match data", async () => {
    const response = await matchAgent.handle(
      makeRequest("score", {
        context: { ...makeRequest("x").context, stadiumId: "nonexistent-stadium" },
      }),
    );
    expect(response.reply).toContain("don't have match information");
    expect(response.requiresClarification).toBe(false);
  });
});
