import { describe, expect, test } from "vitest";
import { foodTool } from "@/tools/food.tool";
import type { Vendor } from "@/types/knowledge";
import type { ToolContext } from "@/types/tool";

const ctx: ToolContext = { sessionId: "test-session", stadiumId: "metlife" };

describe("foodTool", () => {
  test("finds a vendor by a short search term contained in its name", async () => {
    const result = await foodTool.execute({ query: "burger" }, ctx);
    const data = result.data as Vendor[];
    expect(data.some((v) => v.name.toLowerCase().includes("burger"))).toBe(true);
  });

  test("finds a vendor from a natural sentence via a meaningful word", async () => {
    const result = await foodTool.execute({ query: "I want a burger" }, ctx);
    const data = result.data as Vendor[];
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].name.toLowerCase()).toContain("burger");
  });

  test("finds a vendor when the full vendor name is echoed back verbatim", async () => {
    const result = await foodTool.execute({ query: "Order from Green Bowl Kitchen." }, ctx);
    const data = result.data as Vendor[];
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].name).toBe("Green Bowl Kitchen");
  });

  test("falls back to every vendor when nothing matches the query", async () => {
    const result = await foodTool.execute({ query: "sushi" }, ctx);
    const all = await foodTool.execute({}, ctx);
    const data = result.data as Vendor[];
    const allData = all.data as Vendor[];
    expect(data.length).toBe(allData.length);
  });

  test("filters to vendors with a matching dietary tag", async () => {
    const result = await foodTool.execute({ dietary: "vegetarian" }, ctx);
    const data = result.data as Vendor[];
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((v) => v.menu.some((item) => item.dietary?.includes("vegetarian")))).toBe(
      true,
    );
  });

  test("ranks results by lowest crowd, then shortest queue", async () => {
    const result = await foodTool.execute({}, ctx);
    const data = result.data as Vendor[];
    const crowdRank = { low: 0, moderate: 1, high: 2 } as const;
    for (let i = 1; i < data.length; i++) {
      const prevRank = data[i - 1].crowdLevel ? crowdRank[data[i - 1].crowdLevel!] : 3;
      const currRank = data[i].crowdLevel ? crowdRank[data[i].crowdLevel!] : 3;
      if (prevRank !== currRank) {
        expect(prevRank).toBeLessThan(currRank);
      } else {
        expect(data[i - 1].queueEstimateMinutes).toBeLessThanOrEqual(data[i].queueEstimateMinutes);
      }
    }
  });
});
