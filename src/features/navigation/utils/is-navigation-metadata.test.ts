import { describe, expect, test } from "vitest";
import { isNavigationMetadata } from "@/features/navigation/utils/is-navigation-metadata";

describe("isNavigationMetadata", () => {
  test("accepts a well-formed navigation metadata object", () => {
    expect(isNavigationMetadata({ kind: "navigation", status: "found" })).toBe(true);
  });

  test("rejects metadata from a different domain (e.g. emergency)", () => {
    expect(isNavigationMetadata({ kind: "emergency", status: "resolved" })).toBe(false);
  });

  test("rejects null, undefined, and non-object values", () => {
    expect(isNavigationMetadata(null)).toBe(false);
    expect(isNavigationMetadata(undefined)).toBe(false);
    expect(isNavigationMetadata("navigation")).toBe(false);
    expect(isNavigationMetadata(42)).toBe(false);
  });

  test("rejects an object missing a string status", () => {
    expect(isNavigationMetadata({ kind: "navigation" })).toBe(false);
    expect(isNavigationMetadata({ kind: "navigation", status: 1 })).toBe(false);
  });
});
