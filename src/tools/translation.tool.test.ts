import { describe, expect, test, vi, beforeEach } from "vitest";
import type { ToolContext } from "@/types/tool";

const ctx: ToolContext = { sessionId: "test-session", stadiumId: "metlife" };

// Mocks the Vercel AI SDK call so tests never hit the real network — the
// tool's own fallback behavior (offline phrasebook) is what's under test
// here, not Groq's actual translation quality.
const generateTextMock = vi.hoisted(() => vi.fn());
vi.mock("ai", () => ({ generateText: generateTextMock }));
vi.mock("@ai-sdk/groq", () => ({ groq: () => "mock-model" }));

describe("translationTool", () => {
  beforeEach(() => {
    generateTextMock.mockReset();
  });

  test("uses the live model translation when the call succeeds", async () => {
    generateTextMock.mockResolvedValue({ text: "Bonjour" });
    const { translationTool } = await import("@/tools/translation.tool");
    const result = await translationTool.execute({ text: "Hello", targetLanguage: "fr" }, ctx);
    expect(result.success).toBe(true);
    expect(result.source).toBe("groq-llm");
    expect((result.data as { translatedText: string }).translatedText).toBe("Bonjour");
    expect((result.data as { isDemoTranslation: boolean }).isDemoTranslation).toBe(false);
  });

  test("falls back to the offline phrasebook when the model call fails", async () => {
    generateTextMock.mockRejectedValue(new Error("network error"));
    const { translationTool } = await import("@/tools/translation.tool");
    const result = await translationTool.execute({ text: "help me", targetLanguage: "es" }, ctx);
    expect(result.success).toBe(true);
    expect(result.source).toBe("demo-phrasebook");
    expect((result.data as { translatedText: string }).translatedText).toBe("Ayúdame.");
    expect((result.data as { isDemoTranslation: boolean }).isDemoTranslation).toBe(true);
  });

  test("fails honestly (never invents a translation) when both the model and the phrasebook miss", async () => {
    generateTextMock.mockRejectedValue(new Error("network error"));
    const { translationTool } = await import("@/tools/translation.tool");
    const result = await translationTool.execute(
      { text: "a phrase nobody ever asked for before", targetLanguage: "es" },
      ctx,
    );
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
  });

  test("rejects malformed input via its Zod schema", async () => {
    const { translationTool } = await import("@/tools/translation.tool");
    await expect(
      translationTool.execute({ text: 123, targetLanguage: "es" }, ctx),
    ).rejects.toThrow();
  });
});
