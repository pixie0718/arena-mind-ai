import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolveReplyLanguage, crowdLabel, crowdAdjective, byCrowdThen, t } from "./reply-i18n.ts";

describe("resolveReplyLanguage", () => {
  test("passes through supported language codes", () => {
    assert.equal(resolveReplyLanguage("es"), "es");
    assert.equal(resolveReplyLanguage("fr"), "fr");
    assert.equal(resolveReplyLanguage("en"), "en");
  });

  test("falls back to English for an unsupported or missing language", () => {
    assert.equal(resolveReplyLanguage("de"), "en");
    assert.equal(resolveReplyLanguage(undefined), "en");
    assert.equal(resolveReplyLanguage(""), "en");
  });
});

describe("crowdLabel / crowdAdjective", () => {
  test("returns the correct label per language", () => {
    assert.equal(crowdLabel("low", "en"), "Low");
    assert.equal(crowdLabel("low", "es"), "Bajo");
    assert.equal(crowdLabel("low", "fr"), "Faible");
    assert.equal(crowdLabel("high", "en"), "High");
  });

  test("crowdAdjective lowercases English but keeps Spanish feminine agreement", () => {
    assert.equal(crowdAdjective("moderate", "en"), "moderate");
    // "moderado" (crowdLabel) would be grammatically wrong next to a
    // feminine noun — crowdAdjective must return the feminine "moderada".
    assert.equal(crowdAdjective("moderate", "es"), "moderada");
  });
});

describe("byCrowdThen", () => {
  test("ranks low crowd before moderate before high", () => {
    const items = [
      { id: "high", crowdLevel: "high" as const },
      { id: "low", crowdLevel: "low" as const },
      { id: "moderate", crowdLevel: "moderate" as const },
    ];
    const sorted = [...items].sort(byCrowdThen(() => 0));
    assert.deepEqual(
      sorted.map((i) => i.id),
      ["low", "moderate", "high"],
    );
  });

  test("items with no crowd level sort last, not as if they were low", () => {
    const items = [
      { id: "unknown", crowdLevel: undefined },
      { id: "high", crowdLevel: "high" as const },
      { id: "low", crowdLevel: "low" as const },
    ];
    const sorted = [...items].sort(byCrowdThen(() => 0));
    assert.deepEqual(
      sorted.map((i) => i.id),
      ["low", "high", "unknown"],
    );
  });

  test("falls back to the secondary comparator within the same crowd level", () => {
    const items = [
      { id: "b", crowdLevel: "low" as const, order: 2 },
      { id: "a", crowdLevel: "low" as const, order: 1 },
    ];
    const sorted = [...items].sort(byCrowdThen((x, y) => x.order - y.order));
    assert.deepEqual(
      sorted.map((i) => i.id),
      ["a", "b"],
    );
  });
});

describe("t (phrase templates)", () => {
  test("seatBits joins row and seat with the right localized labels", () => {
    assert.equal(t.seatBits("en", "F", "18"), "Row F, Seat 18");
    assert.equal(t.seatBits("es", "F", "18"), "Fila F, Asiento 18");
  });

  test("seatBits omits missing fields instead of leaving a dangling label", () => {
    assert.equal(t.seatBits("en", undefined, "18"), "Seat 18");
    assert.equal(t.seatBits("en", "F", undefined), "Row F");
    assert.equal(t.seatBits("en", undefined, undefined), "");
  });

  test("fallbackUnknownIntent never claims a capability the app doesn't have", () => {
    const reply = t.fallbackUnknownIntent("en");
    assert.ok(reply.includes("seat"));
    assert.ok(reply.includes("emergency"));
  });
});
