import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { formatMessageText } from "./format-message-text.ts";

describe("formatMessageText", () => {
  test("plain text with no bold markers is a single text segment", () => {
    const segments = formatMessageText("Head toward Gate A.");
    assert.deepEqual(segments, [{ type: "text", value: "Head toward Gate A." }]);
  });

  test("splits out a bold segment in the middle of a sentence", () => {
    const segments = formatMessageText("Try **Green Bowl Kitchen** for lunch.");
    assert.deepEqual(segments, [
      { type: "text", value: "Try " },
      { type: "bold", value: "Green Bowl Kitchen" },
      { type: "text", value: " for lunch." },
    ]);
  });

  test("handles a bold segment with nothing before or after it", () => {
    const segments = formatMessageText("**Gate A**");
    assert.deepEqual(segments, [{ type: "bold", value: "Gate A" }]);
  });

  test("handles multiple bold segments in one string", () => {
    const segments = formatMessageText("**Gate A** or **Gate B**");
    assert.deepEqual(segments, [
      { type: "bold", value: "Gate A" },
      { type: "text", value: " or " },
      { type: "bold", value: "Gate B" },
    ]);
  });

  test("empty input produces no segments", () => {
    assert.deepEqual(formatMessageText(""), []);
  });
});
