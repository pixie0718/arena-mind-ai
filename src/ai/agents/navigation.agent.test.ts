import { describe, expect, test } from "vitest";
import { navigationAgent } from "@/ai/agents/navigation.agent";
import { makeRequest } from "@/ai/agents/test-helpers";

describe("navigationAgent", () => {
  test("finds a real section and reports its real gate and walking time", async () => {
    const response = await navigationAgent.handle(
      makeRequest("My seat is Section 102, Row F, Seat 18", { intent: "navigation" }),
    );
    expect(response.reply).toContain("Gate B");
    expect(response.reply).toContain("4 minutes");
  });

  test("asks for a section instead of guessing when none is given", async () => {
    const response = await navigationAgent.handle(
      makeRequest("find my seat", { intent: "navigation" }),
    );
    expect(response.requiresClarification).toBe(true);
  });

  test("falls back to a previously-linked seat instead of re-asking", async () => {
    const request = makeRequest("Find my gate", {
      intent: "navigation",
      context: {
        ...makeRequest("x").context,
        linkedTicket: { stadiumId: "metlife", block: "102", row: "F", seat: "18" },
      },
    });
    const response = await navigationAgent.handle(request);
    expect(response.reply).toContain("Gate B");
    expect(response.requiresClarification).toBe(false);
  });

  test("a fresh section mentioned this turn wins over a previously-linked one", async () => {
    const request = makeRequest("Actually my seat is Section 101", {
      intent: "navigation",
      context: {
        ...makeRequest("x").context,
        linkedTicket: { stadiumId: "metlife", block: "102", row: "F", seat: "18" },
      },
    });
    const response = await navigationAgent.handle(request);
    expect(response.reply).toContain("Gate A");
  });

  // Regression: "a"/"an" used to be in the seat-query-parser's stopword
  // list, silently discarding a gate literally named "A".
  test("resolves 'Gate A' correctly, not just 'Gate B' and beyond (regression)", async () => {
    const response = await navigationAgent.handle(
      makeRequest("Take me to Gate A", { intent: "navigation" }),
    );
    expect(response.reply).toContain("Gate A");
    expect(response.requiresClarification).toBe(false);
  });

  test("offers suggestions instead of fabricating a match for an unknown section", async () => {
    const response = await navigationAgent.handle(
      makeRequest("Section 999", { intent: "navigation" }),
    );
    expect(response.reply).toMatch(/couldn't find/i);
  });

  test("finds a real nearest restroom", async () => {
    const response = await navigationAgent.handle(
      makeRequest("Where is the nearest restroom?", { intent: "navigation" }),
    );
    expect(response.reply).toMatch(/restroom/i);
    expect(response.toolCalls).toHaveLength(1);
  });

  test("resolves a restroom for a wheelchair user without asking again for their preference", async () => {
    const request = makeRequest("Where is the nearest restroom?", {
      intent: "navigation",
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
    const response = await navigationAgent.handle(request);
    expect(response.requiresClarification).toBe(false);
    expect(response.reply).toMatch(/restroom/i);
  });

  test("gives real, grounded exit guidance rather than an invented route", async () => {
    const response = await navigationAgent.handle(
      makeRequest("What's the fastest exit?", { intent: "navigation" }),
    );
    expect(response.reply.length).toBeGreaterThan(0);
    expect(response.toolCalls).toHaveLength(1);
  });

  test("offers to open the map when explicitly asked to pick a section visually", async () => {
    const response = await navigationAgent.handle(
      makeRequest("Let me pick my section on the map.", { intent: "navigation" }),
    );
    expect(response.metadata).toMatchObject({ kind: "navigation", status: "browse" });
    expect(response.requiresClarification).toBe(false);
  });

  test("asks a clarifying question for a message that names no seat, restroom, or exit", async () => {
    const response = await navigationAgent.handle(
      makeRequest("I'm a bit lost", { intent: "navigation" }),
    );
    expect(response.toolCalls).toHaveLength(0);
    expect(response.reply.length).toBeGreaterThan(0);
  });
});
