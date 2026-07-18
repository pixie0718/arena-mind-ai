import { describe, expect, test, vi, beforeEach } from "vitest";
import { clearMemory, getMemory } from "@/ai/memory-engine";

// The orchestrator's own routing/memory logic is what's under test here,
// not the intent classifier (already covered in intent-engine.test.ts) —
// mocking it keeps these tests fast and deterministic instead of waiting
// out a real Groq timeout on every run (there's no API key in the test
// environment, so every real call would genuinely time out).
const detectMock = vi.hoisted(() => vi.fn());
vi.mock("@/ai/intent-engine", () => ({ intentEngine: { detect: detectMock } }));

function mockIntent(primary: string, overrides: Record<string, unknown> = {}) {
  detectMock.mockResolvedValue({
    primary,
    secondary: [],
    confidence: 0.9,
    rawInput: "",
    ...overrides,
  });
}

describe("orchestrator", () => {
  beforeEach(() => {
    detectMock.mockReset();
  });

  test("processMessage returns the deterministic fallback for unknown intent, without running any agent", async () => {
    mockIntent("unknown");
    const { processMessage } = await import("@/ai/orchestrator");
    const sessionId = `orch-unknown-${Date.now()}`;
    const result = await processMessage({ sessionId, text: "hey" });
    expect(result.agentResponse).toBeNull();
    expect(result.intent.primary).toBe("unknown");
    expect(result.message.role).toBe("assistant");
    expect(result.message.content.length).toBeGreaterThan(0);
  });

  test("processMessage dispatches to the correct agent for a known intent", async () => {
    mockIntent("navigation");
    const { processMessage } = await import("@/ai/orchestrator");
    const sessionId = `orch-nav-${Date.now()}`;
    const result = await processMessage({
      sessionId,
      text: "My seat is Section 102, Row F, Seat 18",
    });
    expect(result.agentResponse?.agentId).toBe("navigation");
    expect(result.message.content).toContain("Gate B");
  });

  test("both the user and assistant messages are persisted to session memory", async () => {
    mockIntent("food");
    const { processMessage } = await import("@/ai/orchestrator");
    const sessionId = `orch-memory-${Date.now()}`;
    await processMessage({ sessionId, text: "I'm hungry" });
    const memory = getMemory(sessionId);
    expect(memory.messages).toHaveLength(2);
    expect(memory.messages[0].role).toBe("user");
    expect(memory.messages[1].role).toBe("assistant");
  });

  test("a resolved seat is extracted and linked to session memory automatically", async () => {
    mockIntent("navigation");
    const { processMessage } = await import("@/ai/orchestrator");
    const sessionId = `orch-link-${Date.now()}`;
    await processMessage({ sessionId, text: "My seat is Section 102, Row F, Seat 18" });
    const memory = getMemory(sessionId);
    expect(memory.linkedTicket).toMatchObject({
      stadiumId: "metlife",
      block: "102",
      row: "F",
      seat: "18",
    });
  });

  test("a linked seat from an earlier turn is available to a later, different intent", async () => {
    const sessionId = `orch-recall-${Date.now()}`;
    mockIntent("navigation");
    const { processMessage } = await import("@/ai/orchestrator");
    await processMessage({ sessionId, text: "My seat is Section 102, Row F, Seat 18" });

    mockIntent("emergency", { emergencyCategory: "medical" });
    const result = await processMessage({ sessionId, text: "Someone fainted near me" });
    expect(result.message.content).toContain("Section 102");
  });

  test("client-supplied context (stadium/language) is honored over defaults", async () => {
    mockIntent("match");
    const { processMessage } = await import("@/ai/orchestrator");
    const sessionId = `orch-context-${Date.now()}`;
    const result = await processMessage({
      sessionId,
      text: "score",
      context: { stadiumId: "azteca" },
    });
    expect(result.message.content).toContain("Mexico");
  });

  test("prepareTurn and finalizeTurn compose to the same result as processMessage", async () => {
    mockIntent("navigation");
    const { prepareTurn, finalizeTurn } = await import("@/ai/orchestrator");
    const sessionId = `orch-split-${Date.now()}`;
    const prepared = await prepareTurn({ sessionId, text: "Take me to Gate A" });
    expect(prepared.agentResponse).not.toBeNull();
    const finalText = "a custom streamed reply, different from the template";
    const message = finalizeTurn(prepared, finalText);
    expect(message.content).toBe(finalText);
    expect(getMemory(sessionId).messages.at(-1)?.content).toBe(finalText);
  });

  test("a session's memory never leaks into a different session", async () => {
    clearMemory("orch-isolation-a");
    clearMemory("orch-isolation-b");
    mockIntent("navigation");
    const { processMessage } = await import("@/ai/orchestrator");
    await processMessage({
      sessionId: "orch-isolation-a",
      text: "My seat is Section 102, Row F, Seat 18",
    });
    const memoryB = getMemory("orch-isolation-b");
    expect(memoryB.linkedTicket).toBeNull();
    expect(memoryB.messages).toHaveLength(0);
  });
});
