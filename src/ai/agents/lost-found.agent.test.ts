import { describe, expect, test } from "vitest";
import { lostFoundAgent } from "@/ai/agents/lost-found.agent";
import { makeRequest } from "@/ai/agents/test-helpers";

describe("lostFoundAgent", () => {
  test("files a report and returns a real tracking ID for a named item", async () => {
    const response = await lostFoundAgent.handle(
      makeRequest("I lost my wallet", { intent: "lost_found" }),
    );
    expect(response.reply).toContain("wallet");
    expect(response.metadata?.reportId).toBeTruthy();
    expect(response.requiresClarification).toBe(false);
  });

  test("asks what was lost instead of filing a report for a placeholder item", async () => {
    const response = await lostFoundAgent.handle(
      makeRequest("I lost an item", { intent: "lost_found" }),
    );
    expect(response.requiresClarification).toBe(true);
    expect(response.metadata?.reportId).toBeUndefined();
  });

  test("uses the linked seat as the report location when one is known", async () => {
    const request = makeRequest("I lost my jacket", {
      intent: "lost_found",
      context: {
        ...makeRequest("x").context,
        linkedTicket: { stadiumId: "metlife", block: "102", row: "F", seat: "18" },
      },
    });
    const response = await lostFoundAgent.handle(request);
    expect(response.reply).toContain("Section 102");
  });

  test("honestly says a report is unlocated when no seat is known, rather than guessing", async () => {
    const response = await lostFoundAgent.handle(
      makeRequest("I lost my jacket", { intent: "lost_found" }),
    );
    expect(response.reply).toMatch(/don't have a seat on file/i);
  });

  test("tracking a report before any exist for this session says so honestly", async () => {
    const response = await lostFoundAgent.handle(
      makeRequest("track my lost item report", {
        intent: "lost_found",
        context: {
          ...makeRequest("x").context,
          sessionId: `no-reports-${Date.now()}-${Math.random()}`,
        },
      }),
    );
    expect(response.reply).toMatch(/don't see any lost item reports/i);
  });

  test("tracking after filing returns the same report, not a fabricated one", async () => {
    const sessionId = `track-session-${Date.now()}-${Math.random()}`;
    const filed = await lostFoundAgent.handle(
      makeRequest("I lost my keys", {
        intent: "lost_found",
        context: { ...makeRequest("x").context, sessionId },
      }),
    );
    const tracked = await lostFoundAgent.handle(
      makeRequest("track my report", {
        intent: "lost_found",
        context: { ...makeRequest("x").context, sessionId },
      }),
    );
    expect(tracked.reply).toContain(String(filed.metadata?.reportId));
  });
});
