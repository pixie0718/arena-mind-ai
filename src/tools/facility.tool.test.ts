import { describe, expect, test } from "vitest";
import { facilityTool } from "@/tools/facility.tool";
import type { Facility } from "@/types/knowledge";
import type { ToolContext } from "@/types/tool";

const ctx: ToolContext = { sessionId: "test-session", stadiumId: "metlife" };

describe("facilityTool", () => {
  test("returns only restrooms when filtered by type", async () => {
    const result = await facilityTool.execute({ type: "restroom" }, ctx);
    const data = result.data as Facility[];
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((f) => f.type === "restroom")).toBe(true);
  });

  test("returns every facility (unfiltered) when no type is given", async () => {
    const withType = await facilityTool.execute({ type: "restroom" }, ctx);
    const withoutType = await facilityTool.execute({}, ctx);
    const all = withoutType.data as Facility[];
    const restrooms = withType.data as Facility[];
    expect(all.length).toBeGreaterThan(restrooms.length);
  });

  test("filters to accessible-only facilities when requested", async () => {
    const result = await facilityTool.execute({ type: "restroom", accessibleOnly: true }, ctx);
    const data = result.data as Facility[];
    expect(data.every((f) => f.accessible)).toBe(true);
  });

  test("ranks results by lowest crowd level first", async () => {
    const result = await facilityTool.execute({ type: "restroom" }, ctx);
    const data = result.data as Facility[];
    const crowdRank = { low: 0, moderate: 1, high: 2 } as const;
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1].crowdLevel ? crowdRank[data[i - 1].crowdLevel!] : 3;
      const curr = data[i].crowdLevel ? crowdRank[data[i].crowdLevel!] : 3;
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });

  test("returns an empty array (not an error) for a stadium with no facility data", async () => {
    const result = await facilityTool.execute(
      { type: "restroom" },
      { ...ctx, stadiumId: "hardrock" },
    );
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });
});
