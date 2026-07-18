import { describe, expect, test } from "vitest";
import { isEmergencyMetadata } from "@/features/emergency/utils/is-emergency-metadata";

describe("isEmergencyMetadata", () => {
  test("accepts a well-formed emergency metadata object", () => {
    expect(isEmergencyMetadata({ kind: "emergency", status: "resolved" })).toBe(true);
  });

  test("rejects metadata from a different domain (e.g. navigation)", () => {
    expect(isEmergencyMetadata({ kind: "navigation", status: "found" })).toBe(false);
  });

  test("rejects null, undefined, and non-object values", () => {
    expect(isEmergencyMetadata(null)).toBe(false);
    expect(isEmergencyMetadata(undefined)).toBe(false);
    expect(isEmergencyMetadata([])).toBe(false);
  });
});
