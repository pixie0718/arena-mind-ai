import { z } from "zod";
import type { ToolContext, ToolDefinition, ToolResult } from "@/types/tool";
import { getFaqs } from "@/lib/knowledge";
import type { FaqItem } from "@/types/knowledge";

const inputSchema = z.object({
  query: z.string(),
});

export type FaqSearchInput = z.infer<typeof inputSchema>;

async function execute(
  rawInput: unknown,
  _context: ToolContext,
): Promise<ToolResult<FaqItem[]>> {
  const input = inputSchema.parse(rawInput);
  const query = input.query.toLowerCase();

  const matches = getFaqs().filter(
    (faq) =>
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.category.toLowerCase().includes(query),
  );

  return { success: true, data: matches, source: "knowledge/faq" };
}

export const faqTool: ToolDefinition<FaqItem[]> = {
  name: "faq",
  description: "Searches the venue FAQ knowledge base for a matching answer.",
  inputSchema,
  execute,
};
