import { describe, expect, test } from "vitest";
import { resolveReplyLanguage, crowdLabel, crowdAdjective, byCrowdThen, t } from "@/ai/reply-i18n";

describe("resolveReplyLanguage", () => {
  test("passes through supported language codes", () => {
    expect(resolveReplyLanguage("es")).toBe("es");
    expect(resolveReplyLanguage("fr")).toBe("fr");
    expect(resolveReplyLanguage("en")).toBe("en");
  });

  test("falls back to English for an unsupported or missing language", () => {
    expect(resolveReplyLanguage("de")).toBe("en");
    expect(resolveReplyLanguage(undefined)).toBe("en");
    expect(resolveReplyLanguage("")).toBe("en");
  });
});

describe("crowdLabel / crowdAdjective", () => {
  test("returns the correct label per language", () => {
    expect(crowdLabel("low", "en")).toBe("Low");
    expect(crowdLabel("low", "es")).toBe("Bajo");
    expect(crowdLabel("low", "fr")).toBe("Faible");
    expect(crowdLabel("high", "en")).toBe("High");
  });

  test("crowdAdjective lowercases English but keeps Spanish feminine agreement", () => {
    expect(crowdAdjective("moderate", "en")).toBe("moderate");
    // "moderado" (crowdLabel) would be grammatically wrong next to a
    // feminine noun — crowdAdjective must return the feminine "moderada".
    expect(crowdAdjective("moderate", "es")).toBe("moderada");
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
    expect(sorted.map((i) => i.id)).toEqual(["low", "moderate", "high"]);
  });

  test("items with no crowd level sort last, not as if they were low", () => {
    const items = [
      { id: "unknown", crowdLevel: undefined },
      { id: "high", crowdLevel: "high" as const },
      { id: "low", crowdLevel: "low" as const },
    ];
    const sorted = [...items].sort(byCrowdThen(() => 0));
    expect(sorted.map((i) => i.id)).toEqual(["low", "high", "unknown"]);
  });

  test("falls back to the secondary comparator within the same crowd level", () => {
    const items = [
      { id: "b", crowdLevel: "low" as const, order: 2 },
      { id: "a", crowdLevel: "low" as const, order: 1 },
    ];
    const sorted = [...items].sort(byCrowdThen((x, y) => x.order - y.order));
    expect(sorted.map((i) => i.id)).toEqual(["a", "b"]);
  });
});

describe("t (phrase templates)", () => {
  test("seatBits joins row and seat with the right localized labels", () => {
    expect(t.seatBits("en", "F", "18")).toBe("Row F, Seat 18");
    expect(t.seatBits("es", "F", "18")).toBe("Fila F, Asiento 18");
  });

  test("seatBits omits missing fields instead of leaving a dangling label", () => {
    expect(t.seatBits("en", undefined, "18")).toBe("Seat 18");
    expect(t.seatBits("en", "F", undefined)).toBe("Row F");
    expect(t.seatBits("en", undefined, undefined)).toBe("");
  });

  test("fallbackUnknownIntent never claims a capability the app doesn't have", () => {
    const reply = t.fallbackUnknownIntent("en");
    expect(reply).toContain("seat");
    expect(reply).toContain("emergency");
  });
});
