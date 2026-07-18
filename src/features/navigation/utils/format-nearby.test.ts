import { describe, expect, test } from "vitest";
import { buildWalkingDirections } from "@/features/navigation/utils/format-nearby";
import type { StadiumSectionConfig } from "@/types/stadium-config";

function makeSection(overrides: Partial<StadiumSectionConfig> = {}): StadiumSectionConfig {
  return {
    id: "102",
    label: "Section 102",
    gate: "B",
    level: 1,
    walkingTimeMinutes: 4,
    accessible: false,
    nearby: {},
    crowdLevel: "moderate",
    ...overrides,
  };
}

describe("buildWalkingDirections", () => {
  test("always includes the entry gate and destination as the first two steps", () => {
    const steps = buildWalkingDirections(makeSection());
    expect(steps[0]).toBe("Enter through Gate B");
    expect(steps[1]).toBe("Head to Section 102");
  });

  test("mentions a nearby restroom only when the section actually has one", () => {
    const withRestroom = buildWalkingDirections(
      makeSection({ nearby: { restroom: "Restroom - Block B" } }),
    );
    expect(withRestroom.some((step) => step.includes("Restroom - Block B"))).toBe(true);

    const without = buildWalkingDirections(makeSection({ nearby: {} }));
    expect(without.some((step) => step.toLowerCase().includes("restroom"))).toBe(false);
  });

  test("mentions nearby food only when present, never inventing a vendor", () => {
    const withFood = buildWalkingDirections(makeSection({ nearby: { food: "Burger Express" } }));
    expect(withFood.some((step) => step.includes("Burger Express"))).toBe(true);

    const without = buildWalkingDirections(makeSection({ nearby: {} }));
    expect(without.some((step) => step.toLowerCase().includes("food"))).toBe(false);
  });
});
