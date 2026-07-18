import { describe, expect, test } from "vitest";
import { detectByKeywords } from "@/ai/intent-engine";

/**
 * `detectByKeywords` is the pure, offline fallback classifier used when
 * the Groq call fails/times out — deliberately tested in isolation here
 * (no network call, no API key needed) since it's also the safety net
 * that has to keep working through a real model outage.
 */
describe("detectByKeywords", () => {
  test("classifies a seat/navigation request", () => {
    expect(detectByKeywords("What section is Row F Seat 18 in?").primary).toBe("navigation");
  });

  test("classifies a food request", () => {
    expect(detectByKeywords("I'm hungry, where can I get a burger?").primary).toBe("food");
  });

  test("classifies an emergency request", () => {
    expect(detectByKeywords("Someone collapsed near me").primary).toBe("emergency");
  });

  test("classifies a translation request", () => {
    expect(detectByKeywords("Can you translate this to Spanish?").primary).toBe("translation");
  });

  // Regression test: "transport" itself was missing from the keyword list
  // entirely — "Nearest transport" fell through to "unknown" and, with no
  // grounded facts, the LLM filled the gap with fabricated transit details
  // (a real train station name, invented bus route numbers) in production.
  test("classifies a bare 'transport' request (regression)", () => {
    expect(detectByKeywords("Nearest transport").primary).toBe("transport");
  });

  test("classifies a parking/rideshare request as transport", () => {
    expect(detectByKeywords("Where can I find a taxi or parking?").primary).toBe("transport");
  });

  test("classifies a match/score request", () => {
    expect(detectByKeywords("What's the score right now?").primary).toBe("match");
  });

  test("classifies a lost item request", () => {
    expect(detectByKeywords("I lost my wallet").primary).toBe("lost_found");
  });

  test("falls back to unknown for a greeting with no domain keywords", () => {
    expect(detectByKeywords("hey there").primary).toBe("unknown");
  });

  test("falls back to unknown for gibberish", () => {
    expect(detectByKeywords("asdkjaslkdj alksdjas").primary).toBe("unknown");
  });

  test("prefers the more specific match by total keyword length, not first match", () => {
    // "restroom" (navigation) is a longer, more specific match than any
    // stray overlap — this is the tie-breaking rule the classifier relies
    // on to avoid short generic words winning over specific phrases.
    expect(detectByKeywords("Where is the nearest restroom?").primary).toBe("navigation");
  });

  test("secondary array never includes the primary intent", () => {
    const result = detectByKeywords("I'm hungry, what's nearby?");
    expect(result.secondary).not.toContain(result.primary);
  });

  test("confidence is 0 when nothing matches", () => {
    expect(detectByKeywords("xyz").confidence).toBe(0);
  });
});
