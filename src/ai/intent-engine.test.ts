import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { detectByKeywords } from "./intent-engine.ts";

/**
 * `detectByKeywords` is the pure, offline fallback classifier used when
 * the Groq call fails/times out — deliberately tested in isolation here
 * (no network call, no API key needed) since it's also the safety net
 * that has to keep working through a real model outage.
 */
describe("detectByKeywords", () => {
  test("classifies a seat/navigation request", () => {
    const result = detectByKeywords("What section is Row F Seat 18 in?");
    assert.equal(result.primary, "navigation");
  });

  test("classifies a food request", () => {
    const result = detectByKeywords("I'm hungry, where can I get a burger?");
    assert.equal(result.primary, "food");
  });

  test("classifies an emergency request", () => {
    const result = detectByKeywords("Someone collapsed near me");
    assert.equal(result.primary, "emergency");
  });

  test("classifies a translation request", () => {
    const result = detectByKeywords("Can you translate this to Spanish?");
    assert.equal(result.primary, "translation");
  });

  // Regression test: "transport" itself was missing from the keyword list
  // entirely — "Nearest transport" fell through to "unknown" and, with no
  // grounded facts, the LLM filled the gap with fabricated transit details
  // (a real train station name, invented bus route numbers) in production.
  test("classifies a bare 'transport' request (regression)", () => {
    const result = detectByKeywords("Nearest transport");
    assert.equal(result.primary, "transport");
  });

  test("classifies a parking/rideshare request as transport", () => {
    const result = detectByKeywords("Where can I find a taxi or parking?");
    assert.equal(result.primary, "transport");
  });

  test("classifies a match/score request", () => {
    const result = detectByKeywords("What's the score right now?");
    assert.equal(result.primary, "match");
  });

  test("classifies a lost item request", () => {
    const result = detectByKeywords("I lost my wallet");
    assert.equal(result.primary, "lost_found");
  });

  test("falls back to unknown for a greeting with no domain keywords", () => {
    const result = detectByKeywords("hey there");
    assert.equal(result.primary, "unknown");
  });

  test("falls back to unknown for gibberish", () => {
    const result = detectByKeywords("asdkjaslkdj alksdjas");
    assert.equal(result.primary, "unknown");
  });

  test("prefers the more specific match by total keyword length, not first match", () => {
    // "restroom" (navigation) is a longer, more specific match than any
    // stray overlap — this is the tie-breaking rule the classifier relies
    // on to avoid short generic words winning over specific phrases.
    const result = detectByKeywords("Where is the nearest restroom?");
    assert.equal(result.primary, "navigation");
  });
});
