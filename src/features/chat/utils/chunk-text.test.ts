import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { chunkText } from "./chunk-text.ts";

describe("chunkText", () => {
  test("splits on whitespace, keeping trailing spaces attached to the word before them", () => {
    const chunks = chunkText("Hello there, friend");
    assert.deepEqual(chunks, ["Hello ", "there, ", "friend"]);
  });

  test("rejoining every chunk reconstructs the exact original text", () => {
    const inputs = [
      "Hello there, friend",
      "Section 102 — Row F, Seat 18 is closest to Gate B.",
      "  leading and trailing spaces  ",
      "no-spaces-at-all",
      "multiple   spaces   between   words",
      "line one\nline two",
    ];
    for (const text of inputs) {
      assert.equal(chunkText(text).join(""), text, `failed to reconstruct: ${JSON.stringify(text)}`);
    }
  });

  test("returns an empty array for empty input", () => {
    assert.deepEqual(chunkText(""), []);
  });

  test("never produces an empty-string chunk", () => {
    const chunks = chunkText("a  b   c");
    assert.ok(chunks.every((chunk) => chunk.length > 0));
  });
});
