import { z } from "zod";
import type { ToolContext, ToolDefinition, ToolResult } from "@/types/tool";
import { getVendors } from "@/lib/knowledge";
import type { Vendor } from "@/types/knowledge";
import { byCrowdThen } from "@/ai/reply-i18n";

const inputSchema = z.object({
  query: z.string().optional(),
  dietary: z.string().optional(),
});

export type FoodSearchInput = z.infer<typeof inputSchema>;

async function execute(rawInput: unknown, context: ToolContext): Promise<ToolResult<Vendor[]>> {
  const input = inputSchema.parse(rawInput ?? {});
  const vendors = getVendors(context.stadiumId);
  const query = input.query?.toLowerCase();
  const dietary = input.dietary;

  // Words long enough to be meaningful ("burger", "pizza") rather than
  // filler ("i", "a", "the") — lets a natural sentence like "I want a
  // burger" find "Burger Express" without requiring the whole sentence or
  // the whole vendor name to appear verbatim inside the other.
  const queryWords = query?.split(/\s+/).filter((word) => word.length > 2) ?? [];

  const filtered = vendors.filter((vendor) => {
    const vendorName = vendor.name.toLowerCase();
    const menuNames = vendor.menu.map((item) => item.name.toLowerCase());
    const matchesQuery =
      !query ||
      // Short free-text search term contained in the vendor/menu name
      // ("pizza" -> "Pizza Corner")...
      vendorName.includes(query) ||
      vendor.category.toLowerCase().includes(query) ||
      menuNames.some((name) => name.includes(query)) ||
      // ...or the vendor/menu name contained in a longer sentence, as when
      // a suggested action's full prompt text is re-sent verbatim ("Order
      // from Pizza Corner." contains "pizza corner", not the other way
      // around)...
      query.includes(vendorName) ||
      menuNames.some((name) => query.includes(name)) ||
      // ...or a meaningful word from a natural sentence appears in the
      // vendor/menu name ("I want a burger" -> "Burger Express").
      queryWords.some(
        (word) => vendorName.includes(word) || menuNames.some((name) => name.includes(word)),
      );

    const matchesDietary = !dietary || vendor.menu.some((item) => item.dietary?.includes(dietary));

    return matchesQuery && matchesDietary;
  });

  const results = [...(filtered.length > 0 ? filtered : vendors)].sort(
    byCrowdThen((a, b) => a.queueEstimateMinutes - b.queueEstimateMinutes),
  );

  return { success: true, data: results, source: "knowledge/vendors" };
}

export const foodTool: ToolDefinition<Vendor[]> = {
  name: "food",
  description:
    "Searches nearby food vendors and menu items, ranked by lowest crowd level then shortest queue.",
  inputSchema,
  execute,
};
