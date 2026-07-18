import { describe, expect, test } from "vitest";
import {
  getMemory,
  appendMessage,
  setActiveIntent,
  setActiveWorkflow,
  setLinkedTicket,
  clearMemory,
} from "@/ai/memory-engine";
import type { ChatMessage } from "@/types/message";

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "msg-1",
    role: "user",
    content: "hello",
    createdAt: new Date(0).toISOString(),
    ...overrides,
  };
}

describe("memory-engine", () => {
  test("creates fresh, empty memory for a session that's never been seen", () => {
    const memory = getMemory("session-fresh");
    expect(memory.sessionId).toBe("session-fresh");
    expect(memory.messages).toEqual([]);
    expect(memory.linkedTicket).toBeNull();
    expect(memory.preferredLanguage).toBe("en");
  });

  test("getMemory returns the SAME object on repeated calls (not a new empty one each time)", () => {
    const first = getMemory("session-identity");
    appendMessage("session-identity", makeMessage());
    const second = getMemory("session-identity");
    expect(second).toBe(first);
    expect(second.messages).toHaveLength(1);
  });

  test("appendMessage accumulates messages in order", () => {
    clearMemory("session-order");
    appendMessage("session-order", makeMessage({ id: "1", content: "first" }));
    appendMessage("session-order", makeMessage({ id: "2", content: "second" }));
    const memory = getMemory("session-order");
    expect(memory.messages.map((m) => m.content)).toEqual(["first", "second"]);
  });

  test("setActiveIntent updates the session's active intent", () => {
    clearMemory("session-intent");
    setActiveIntent("session-intent", "navigation");
    expect(getMemory("session-intent").activeIntent).toBe("navigation");
  });

  test("setActiveWorkflow can be set and cleared", () => {
    clearMemory("session-workflow");
    setActiveWorkflow("session-workflow", "lost_found_report");
    expect(getMemory("session-workflow").activeWorkflow).toBe("lost_found_report");
    setActiveWorkflow("session-workflow", undefined);
    expect(getMemory("session-workflow").activeWorkflow).toBeUndefined();
  });

  test("setLinkedTicket persists a seat across calls", () => {
    clearMemory("session-ticket");
    setLinkedTicket("session-ticket", { stadiumId: "metlife", block: "102", row: "F", seat: "18" });
    expect(getMemory("session-ticket").linkedTicket).toEqual({
      stadiumId: "metlife",
      block: "102",
      row: "F",
      seat: "18",
    });
  });

  test("clearMemory removes the session entirely (a fresh getMemory call starts empty again)", () => {
    appendMessage("session-clear", makeMessage());
    expect(getMemory("session-clear").messages).toHaveLength(1);
    clearMemory("session-clear");
    expect(getMemory("session-clear").messages).toEqual([]);
  });

  test("two different sessions never share state", () => {
    clearMemory("session-a");
    clearMemory("session-b");
    setLinkedTicket("session-a", { stadiumId: "metlife", block: "101", row: "A", seat: "1" });
    expect(getMemory("session-b").linkedTicket).toBeNull();
  });
});
