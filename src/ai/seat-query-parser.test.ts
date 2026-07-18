import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseSeatQuery } from "./seat-query-parser.ts";

describe("parseSeatQuery", () => {
  test("extracts section, row, and seat from a full sentence", () => {
    const result = parseSeatQuery("My seat is Section 132, Row F, Seat 18.");
    assert.equal(result.sectionId, "132");
    assert.equal(result.row, "F");
    assert.equal(result.seatNumber, "18");
  });

  test("extracts a gate reference and uppercases it", () => {
    const result = parseSeatQuery("Take me to gate b");
    assert.equal(result.gate, "B");
  });

  // Regression test: "a"/"an" were previously in the stopword list used to
  // filter out grammatical words like "is"/"the" from a captured value —
  // but that also silently discarded any real gate or row literally named
  // "A", since the filter is case-insensitive. Found live: "Take me to
  // Gate A" fell through to a generic clarification while "Gate B" worked.
  test("does not drop a gate literally named 'A' (regression)", () => {
    const result = parseSeatQuery("Take me to Gate A");
    assert.equal(result.gate, "A");
  });

  test("does not drop a row literally named 'A' (regression)", () => {
    const result = parseSeatQuery("My seat is Section 103, Row A, Seat 5");
    assert.equal(result.row, "A");
    assert.equal(result.sectionId, "103");
    assert.equal(result.seatNumber, "5");
  });

  test("skips 'is' when 'seat' appears twice in one sentence", () => {
    // "seat is" would be a false match for seatNumber if the first
    // occurrence of "seat" weren't skipped in favor of the real one later.
    const result = parseSeatQuery("My seat is near Seat 42");
    assert.equal(result.seatNumber, "42");
  });

  test("returns all undefined fields for unrelated text", () => {
    const result = parseSeatQuery("Where can I get a burger?");
    assert.equal(result.sectionId, undefined);
    assert.equal(result.row, undefined);
    assert.equal(result.seatNumber, undefined);
    assert.equal(result.gate, undefined);
  });

  test("does not let 'security' match the 'sec' section abbreviation", () => {
    const result = parseSeatQuery("There is a security threat nearby");
    assert.equal(result.sectionId, undefined);
  });

  test("accepts 'block' as a section synonym", () => {
    const result = parseSeatQuery("I'm in Block 204");
    assert.equal(result.sectionId, "204");
  });
});
