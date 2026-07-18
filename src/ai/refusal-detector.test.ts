import { describe, expect, test } from "vitest";
import { normalizeApostrophes, isFalseRefusal, REFUSAL_PATTERN } from "@/ai/refusal-detector";

describe("normalizeApostrophes", () => {
  test("converts typographic (curly) apostrophes to plain ASCII", () => {
    expect(normalizeApostrophes("I don’t have that")).toBe("I don't have that");
    expect(normalizeApostrophes("It‘s fine")).toBe("It's fine");
  });

  test("leaves plain ASCII apostrophes and unrelated text untouched", () => {
    expect(normalizeApostrophes("I don't have that")).toBe("I don't have that");
    expect(normalizeApostrophes("Gate B, 4 minutes")).toBe("Gate B, 4 minutes");
  });
});

describe("isFalseRefusal", () => {
  // Regression test for the most severe bug found in this codebase: the
  // model claimed it lacked information the deterministic agent actually
  // had ("I'm sorry, I don't have information on the fastest exit route
  // after the match") while the real baseline was a substantive answer
  // ("Head toward Gate A — about 3 minutes away."). The very first version
  // of this check used a regex with a plain ASCII apostrophe, but the
  // model's streamed text used a curly one — the check matched nothing
  // and 4 of 5 refusals slipped through live before this was caught.
  test("flags a refusal (with a curly apostrophe) against a substantive baseline", () => {
    const generated =
      "I’m sorry—I don’t have information on the fastest exit route after the match.";
    const baseline = "Head toward Gate A — about 3 minutes away.";
    expect(isFalseRefusal(generated, baseline)).toBe(true);
  });

  test("flags a refusal with a plain ASCII apostrophe too", () => {
    const generated = "I'm sorry, I don't have information on that.";
    const baseline = "Section 102 is closest to Gate B.";
    expect(isFalseRefusal(generated, baseline)).toBe(true);
  });

  test("flags the 'I'm not seeing' phrasing variant", () => {
    const generated = "I’m not seeing a specific fastest-exit recommendation right now.";
    const baseline = "Head toward Gate A — about 3 minutes away.";
    expect(isFalseRefusal(generated, baseline)).toBe(true);
  });

  test("does not flag a real, substantive answer", () => {
    const generated = "Head toward Gate A — about 3 minutes away.";
    const baseline = "Head toward Gate A — about 3 minutes away.";
    expect(isFalseRefusal(generated, baseline)).toBe(false);
  });

  test("does not flag a natural rephrase that keeps the real facts", () => {
    const generated = "You’ll want Gate A, roughly a 3 minute walk from here.";
    const baseline = "Head toward Gate A — about 3 minutes away.";
    expect(isFalseRefusal(generated, baseline)).toBe(false);
  });

  // A legitimately-grounded "I don't have that" must still be allowed
  // through — the check only fires when the model denies something the
  // baseline actually answered.
  test("does not flag a refusal when the baseline was ALSO a refusal", () => {
    const generated = "I’m sorry, I don’t have that information right now.";
    const baseline = "I don't have that information right now.";
    // Sanity-check the premise of this test: the baseline must actually be
    // refusal-shaped for "both sides refused" to be the case under test.
    expect(REFUSAL_PATTERN.test(baseline)).toBe(true);
    expect(isFalseRefusal(generated, baseline)).toBe(false);
  });

  test("does not flag the legitimate 'no data yet' fallback text against itself", () => {
    const text =
      "I don't have live exit congestion data yet, but any gate you entered through works as an exit.";
    expect(REFUSAL_PATTERN.test(text)).toBe(false);
  });
});
