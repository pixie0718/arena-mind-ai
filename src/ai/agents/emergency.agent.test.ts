import { describe, expect, test } from "vitest";
import { emergencyAgent } from "@/ai/agents/emergency.agent";
import { makeRequest } from "@/ai/agents/test-helpers";

describe("emergencyAgent", () => {
  test("resolves a known section to a real medical team, exit, and ETA", async () => {
    const response = await emergencyAgent.handle(
      makeRequest("Someone fainted, I'm in Section 102", {
        intent: "emergency",
        emergencyCategory: "medical",
      }),
    );
    expect(response.reply).toContain("Section 102");
    expect(response.requiresClarification).toBe(false);
    expect(response.metadata).toMatchObject({
      kind: "emergency",
      status: "resolved",
      category: "medical",
    });
  });

  test("falls back to a previously-linked seat instead of re-asking during an emergency", async () => {
    const request = makeRequest("Someone fainted near me", {
      intent: "emergency",
      emergencyCategory: "medical",
      context: {
        ...makeRequest("x").context,
        linkedTicket: { stadiumId: "metlife", block: "102", row: "F", seat: "18" },
      },
    });
    const response = await emergencyAgent.handle(request);
    expect(response.reply).toContain("Section 102");
    expect(response.requiresClarification).toBe(false);
  });

  test("asks only for the section when no location is known, never guessing one", async () => {
    const response = await emergencyAgent.handle(
      makeRequest("I need help", { intent: "emergency", emergencyCategory: "volunteer_request" }),
    );
    expect(response.requiresClarification).toBe(true);
    expect(response.metadata).toMatchObject({ kind: "emergency", status: "location_unknown" });
  });

  test("category-specific instructions differ between fire and medical", async () => {
    const fire = await emergencyAgent.handle(
      makeRequest("Fire in Section 102", { intent: "emergency", emergencyCategory: "fire" }),
    );
    const medical = await emergencyAgent.handle(
      makeRequest("Someone collapsed in Section 102", {
        intent: "emergency",
        emergencyCategory: "medical",
      }),
    );
    expect(fire.reply).not.toBe(medical.reply);
    expect(fire.reply.toLowerCase()).toMatch(/exit|calmly/);
  });

  test("every category produces a non-empty, immediate acknowledgement", async () => {
    const categories = [
      "medical",
      "injury",
      "fire",
      "crowd",
      "security",
      "suspicious_activity",
      "lost_child",
      "volunteer_request",
      "wheelchair_assistance",
    ] as const;
    for (const category of categories) {
      const response = await emergencyAgent.handle(
        makeRequest("help", { intent: "emergency", emergencyCategory: category }),
      );
      expect(response.reply.length).toBeGreaterThan(0);
    }
  });
});
