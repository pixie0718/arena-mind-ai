import { describe, expect, test } from "vitest";
import { parseSeatQuery } from "@/ai/seat-query-parser";

describe("parseSeatQuery", () => {
  test("extracts section, row, and seat from a full sentence", () => {
    const result = parseSeatQuery("My seat is Section 132, Row F, Seat 18.");
    expect(result.sectionId).toBe("132");
    expect(result.row).toBe("F");
    expect(result.seatNumber).toBe("18");
  });

  test("extracts a gate reference and uppercases it", () => {
    const result = parseSeatQuery("Take me to gate b");
    expect(result.gate).toBe("B");
  });

  // Regression test: "a"/"an" were previously in the stopword list used to
  // filter out grammatical words like "is"/"the" from a captured value —
  // but that also silently discarded any real gate or row literally named
  // "A", since the filter is case-insensitive. Found live: "Take me to
  // Gate A" fell through to a generic clarification while "Gate B" worked.
  test("does not drop a gate literally named 'A' (regression)", () => {
    const result = parseSeatQuery("Take me to Gate A");
    expect(result.gate).toBe("A");
  });

  test("does not drop a row literally named 'A' (regression)", () => {
    const result = parseSeatQuery("My seat is Section 103, Row A, Seat 5");
    expect(result.row).toBe("A");
    expect(result.sectionId).toBe("103");
    expect(result.seatNumber).toBe("5");
  });

  test("skips 'is' when 'seat' appears twice in one sentence", () => {
    // "seat is" would be a false match for seatNumber if the first
    // occurrence of "seat" weren't skipped in favor of the real one later.
    const result = parseSeatQuery("My seat is near Seat 42");
    expect(result.seatNumber).toBe("42");
  });

  test("returns all undefined fields for unrelated text", () => {
    const result = parseSeatQuery("Where can I get a burger?");
    expect(result.sectionId).toBeUndefined();
    expect(result.row).toBeUndefined();
    expect(result.seatNumber).toBeUndefined();
    expect(result.gate).toBeUndefined();
  });

  test("does not let 'security' match the 'sec' section abbreviation", () => {
    const result = parseSeatQuery("There is a security threat nearby");
    expect(result.sectionId).toBeUndefined();
  });

  test("accepts 'block' as a section synonym", () => {
    const result = parseSeatQuery("I'm in Block 204");
    expect(result.sectionId).toBe("204");
  });

  test("handles an empty string without throwing", () => {
    expect(() => parseSeatQuery("")).not.toThrow();
    const result = parseSeatQuery("");
    expect(result.sectionId).toBeUndefined();
  });
});
