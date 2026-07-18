import { describe, expect, test } from "vitest";
import { emergencyTool } from "@/tools/emergency.tool";
import type { EmergencyDispatchResult } from "@/tools/emergency.tool";
import type { ToolContext } from "@/types/tool";

const ctx: ToolContext = { sessionId: "test-session", stadiumId: "metlife" };

describe("emergencyTool", () => {
  test("resolves a known section to a real medical team, exit, and ETA", async () => {
    const result = await emergencyTool.execute({ stadiumId: "metlife", sectionId: "102" }, ctx);
    const data = result.data as EmergencyDispatchResult;
    expect(data.status).toBe("section_known");
    if (data.status === "section_known") {
      expect(data.section.id).toBe("102");
      expect(data.nearestMedicalLabel).toBeTruthy();
      expect(data.nearestExitLabel).toBeTruthy();
    }
  });

  // The ETA is deliberately derived from the section's real walking time,
  // never invented — this test locks that derivation rule in place.
  test("derives ETA from the section's real walking time (never fabricated), with a 2-minute floor", async () => {
    const result = await emergencyTool.execute({ stadiumId: "metlife", sectionId: "102" }, ctx);
    const data = result.data as EmergencyDispatchResult;
    if (data.status === "section_known") {
      expect(data.etaMinutes).toBe(Math.max(2, data.section.walkingTimeMinutes - 1));
      expect(data.etaMinutes).toBeGreaterThanOrEqual(2);
    }
  });

  test("returns section_not_found with suggestions, never guessing a section", async () => {
    const result = await emergencyTool.execute({ stadiumId: "metlife", sectionId: "999" }, ctx);
    const data = result.data as EmergencyDispatchResult;
    expect(data.status).toBe("section_not_found");
    if (data.status === "section_not_found") {
      expect(data.suggestions.length).toBeGreaterThan(0);
    }
  });

  test("returns stadium_only (asks for a section) when none is given, rather than guessing one", async () => {
    const result = await emergencyTool.execute({ stadiumId: "metlife" }, ctx);
    const data = result.data as EmergencyDispatchResult;
    expect(data.status).toBe("stadium_only");
    if (data.status === "stadium_only") {
      expect(data.stadiumName).toBe("MetLife Stadium");
    }
  });

  test("returns unsupported_stadium for a stadium with no config file", async () => {
    const result = await emergencyTool.execute({ stadiumId: "nonexistent-stadium" }, ctx);
    const data = result.data as EmergencyDispatchResult;
    expect(data.status).toBe("unsupported_stadium");
  });
});
