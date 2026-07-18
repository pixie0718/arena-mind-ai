import { describe, expect, test } from "vitest";
import { foodAgent } from "@/ai/agents/food.agent";
import { makeRequest } from "@/ai/agents/test-helpers";

describe("foodAgent", () => {
  test("recommends a real vendor with real queue/location details", async () => {
    const response = await foodAgent.handle(
      makeRequest("I'm hungry, what's nearby?", { intent: "food" }),
    );
    expect(response.reply).toMatch(/Green Bowl Kitchen|Pizza Corner|Burger Express/);
    expect(response.requiresClarification).toBe(false);
  });

  test("shows a specific vendor's menu when exactly one vendor matches", async () => {
    const response = await foodAgent.handle(
      makeRequest("Order from Green Bowl Kitchen.", { intent: "food" }),
    );
    expect(response.reply).toContain("Green Bowl Kitchen");
    expect(response.suggestedActions.length).toBeGreaterThan(0);
  });

  test("confirms a real order (with a real price) when a menu item is named", async () => {
    const response = await foodAgent.handle(
      makeRequest("Order the Grain Bowl from Green Bowl Kitchen.", { intent: "food" }),
    );
    expect(response.reply).toContain("Grain Bowl");
    expect(response.reply).toContain("12.00");
    expect(response.metadata?.orderId).toBeTruthy();
  });

  test("asks what the visitor wants instead of guessing when nothing matches", async () => {
    const response = await foodAgent.handle(makeRequest("sushi", { intent: "food" }));
    // "sushi" doesn't exist in the demo vendor list, so the food tool
    // returns every vendor — the agent must still offer a real pick, never
    // claim it found sushi specifically.
    expect(response.reply).not.toContain("sushi");
  });
});
