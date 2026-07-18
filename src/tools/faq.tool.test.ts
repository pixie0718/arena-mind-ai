import { describe, expect, test } from "vitest";
import { faqTool } from "@/tools/faq.tool";
import type { FaqItem } from "@/types/knowledge";
import type { ToolContext } from "@/types/tool";

const ctx: ToolContext = { sessionId: "test-session", stadiumId: "metlife" };

describe("faqTool", () => {
  test("matches a question by a keyword in the question text", async () => {
    const result = await faqTool.execute({ query: "water bottle" }, ctx);
    const data = result.data as FaqItem[];
    expect(data.length).toBeGreaterThan(0);
    expect(data.some((f) => f.question.toLowerCase().includes("water bottle"))).toBe(true);
  });

  test("matches by category as well as question/answer text", async () => {
    const result = await faqTool.execute({ query: "entry rules" }, ctx);
    const data = result.data as FaqItem[];
    expect(data.length).toBeGreaterThan(0);
  });

  test("returns an empty array (not an error) when nothing matches", async () => {
    const result = await faqTool.execute({ query: "quantum physics" }, ctx);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });
});
