import { describe, expect, test, vi, beforeEach } from "vitest";
import { makeRequest } from "@/ai/agents/test-helpers";

const generateTextMock = vi.hoisted(() => vi.fn());
vi.mock("ai", () => ({ generateText: generateTextMock }));
vi.mock("@ai-sdk/groq", () => ({ groq: () => "mock-model" }));

describe("translationAgent", () => {
  beforeEach(() => {
    generateTextMock.mockReset();
  });

  test("translates an arbitrary phrase via the live model, not just a fixed phrasebook", async () => {
    generateTextMock.mockResolvedValue({ text: "¿Dónde está el baño?" });
    const { translationAgent } = await import("@/ai/agents/translation.agent");
    const response = await translationAgent.handle(
      makeRequest("Translate 'Where is the restroom' to Spanish", { intent: "translation" }),
    );
    expect(response.reply).toContain("¿Dónde está el baño?");
  });

  test("defaults to Spanish when no target language is named", async () => {
    generateTextMock.mockResolvedValue({ text: "Ayúdame" });
    const { translationAgent } = await import("@/ai/agents/translation.agent");
    const response = await translationAgent.handle(
      makeRequest("Translate 'help me'", { intent: "translation" }),
    );
    expect(response.reply).toContain("Spanish");
  });

  test("switches to French when explicitly asked", async () => {
    generateTextMock.mockResolvedValue({ text: "Aidez-moi" });
    const { translationAgent } = await import("@/ai/agents/translation.agent");
    const response = await translationAgent.handle(
      makeRequest("Translate 'help me' to French", { intent: "translation" }),
    );
    expect(response.reply).toContain("French");
    expect(response.reply).toContain("Aidez-moi");
  });
});
