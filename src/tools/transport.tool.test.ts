import { describe, expect, test } from "vitest";
import { transportTool } from "@/tools/transport.tool";
import type { TransportOption } from "@/types/knowledge";
import type { ToolContext } from "@/types/tool";

const ctx: ToolContext = { sessionId: "test-session", stadiumId: "metlife" };

describe("transportTool", () => {
  test("returns every option when no type filter is given", async () => {
    const result = await transportTool.execute({}, ctx);
    const data = result.data as TransportOption[];
    expect(data.length).toBeGreaterThan(0);
  });

  test("filters to a single type when requested", async () => {
    const result = await transportTool.execute({ type: "parking" }, ctx);
    const data = result.data as TransportOption[];
    expect(data.every((o) => o.type === "parking")).toBe(true);
  });

  test("ranks results by lowest crowd, then fastest ETA", async () => {
    const result = await transportTool.execute({}, ctx);
    const data = result.data as TransportOption[];
    const crowdRank = { low: 0, moderate: 1, high: 2 } as const;
    for (let i = 1; i < data.length; i++) {
      const prevRank = data[i - 1].crowdLevel ? crowdRank[data[i - 1].crowdLevel!] : 3;
      const currRank = data[i].crowdLevel ? crowdRank[data[i].crowdLevel!] : 3;
      if (prevRank !== currRank) {
        expect(prevRank).toBeLessThan(currRank);
      } else {
        expect(data[i - 1].etaMinutes).toBeLessThanOrEqual(data[i].etaMinutes);
      }
    }
  });

  test("rejects an unsupported transport type via Zod", async () => {
    await expect(transportTool.execute({ type: "spaceship" }, ctx)).rejects.toThrow();
  });
});
