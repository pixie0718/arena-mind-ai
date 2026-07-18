import { describe, expect, test } from "vitest";
import { buildContext } from "@/ai/context-engine";

describe("buildContext", () => {
  test("applies sane defaults when only sessionId is given", () => {
    const context = buildContext({ sessionId: "s1" });
    expect(context.sessionId).toBe("s1");
    expect(context.language).toBe("en");
    expect(context.linkedTicket).toBeNull();
    expect(context.accessibility).toEqual({
      wheelchair: false,
      largeText: false,
      highContrast: false,
      voiceFirst: false,
    });
  });

  test("uses the provided stadium and language instead of the defaults", () => {
    const context = buildContext({ sessionId: "s1", stadiumId: "azteca", language: "fr" });
    expect(context.stadiumId).toBe("azteca");
    expect(context.language).toBe("fr");
  });

  test("merges partial accessibility overrides without dropping the other defaults", () => {
    const context = buildContext({ sessionId: "s1", accessibility: { wheelchair: true } });
    expect(context.accessibility.wheelchair).toBe(true);
    expect(context.accessibility.largeText).toBe(false);
  });

  test("passes through a linked ticket when given", () => {
    const ticket = { stadiumId: "metlife", block: "102", row: "F", seat: "18" };
    const context = buildContext({ sessionId: "s1", linkedTicket: ticket });
    expect(context.linkedTicket).toEqual(ticket);
  });

  test("always stamps a currentTime as an ISO string", () => {
    const context = buildContext({ sessionId: "s1" });
    expect(() => new Date(context.currentTime).toISOString()).not.toThrow();
  });
});
