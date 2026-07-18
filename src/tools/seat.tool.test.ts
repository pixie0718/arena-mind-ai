import { describe, expect, test } from "vitest";
import { seatTool } from "@/tools/seat.tool";
import type { SectionLookupResult } from "@/tools/seat.tool";
import type { ToolContext } from "@/types/tool";

const ctx: ToolContext = { sessionId: "test-session", stadiumId: "metlife" };

describe("seatTool", () => {
  test("finds a real section by id and echoes the requested row/seat", async () => {
    const result = await seatTool.execute({ sectionId: "102", row: "F", seatNumber: "18" }, ctx);
    expect(result.success).toBe(true);
    const data = result.data as SectionLookupResult;
    expect(data.status).toBe("found");
    if (data.status === "found") {
      expect(data.section.id).toBe("102");
      expect(data.section.gate).toBe("B");
      expect(data.requested).toEqual({ row: "F", seatNumber: "18" });
    }
  });

  test("returns not_found with suggestions for an unknown section", async () => {
    const result = await seatTool.execute({ sectionId: "999" }, ctx);
    expect(result.success).toBe(false);
    const data = result.data as SectionLookupResult;
    expect(data.status).toBe("not_found");
    if (data.status === "not_found") {
      expect(data.suggestions.length).toBeGreaterThan(0);
    }
  });

  test("finds a real gate case-insensitively and normalizes to uppercase", async () => {
    const result = await seatTool.execute({ gate: "b" }, ctx);
    const data = result.data as SectionLookupResult;
    expect(data.status).toBe("gate_found");
    if (data.status === "gate_found") {
      expect(data.gate).toBe("B");
    }
  });

  test("returns not_found for an unknown gate", async () => {
    const result = await seatTool.execute({ gate: "Z" }, ctx);
    const data = result.data as SectionLookupResult;
    expect(data.status).toBe("not_found");
  });

  test("returns unsupported_stadium for a stadium with no config file", async () => {
    const result = await seatTool.execute(
      { sectionId: "102" },
      { ...ctx, stadiumId: "nonexistent-stadium" },
    );
    const data = result.data as SectionLookupResult;
    expect(data.status).toBe("unsupported_stadium");
  });

  test("returns not_found (not a crash) when neither section nor gate is given", async () => {
    const result = await seatTool.execute({}, ctx);
    expect(result.success).toBe(false);
    const data = result.data as SectionLookupResult;
    expect(data.status).toBe("not_found");
  });

  test("rejects malformed input via its Zod schema instead of throwing an unclear error", async () => {
    await expect(seatTool.execute({ sectionId: 12345 }, ctx)).rejects.toThrow();
  });
});
