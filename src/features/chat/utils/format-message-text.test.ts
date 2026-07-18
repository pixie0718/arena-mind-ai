import { describe, expect, test } from "vitest";
import { formatMessageText } from "@/features/chat/utils/format-message-text";

describe("formatMessageText", () => {
  test("plain text with no bold markers is a single text segment", () => {
    const segments = formatMessageText("Head toward Gate A.");
    expect(segments).toEqual([{ type: "text", value: "Head toward Gate A." }]);
  });

  test("splits out a bold segment in the middle of a sentence", () => {
    const segments = formatMessageText("Try **Green Bowl Kitchen** for lunch.");
    expect(segments).toEqual([
      { type: "text", value: "Try " },
      { type: "bold", value: "Green Bowl Kitchen" },
      { type: "text", value: " for lunch." },
    ]);
  });

  test("handles a bold segment with nothing before or after it", () => {
    const segments = formatMessageText("**Gate A**");
    expect(segments).toEqual([{ type: "bold", value: "Gate A" }]);
  });

  test("handles multiple bold segments in one string", () => {
    const segments = formatMessageText("**Gate A** or **Gate B**");
    expect(segments).toEqual([
      { type: "bold", value: "Gate A" },
      { type: "text", value: " or " },
      { type: "bold", value: "Gate B" },
    ]);
  });

  test("empty input produces no segments", () => {
    expect(formatMessageText("")).toEqual([]);
  });
});
