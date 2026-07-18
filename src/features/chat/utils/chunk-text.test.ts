import { describe, expect, test } from "vitest";
import { chunkText } from "@/features/chat/utils/chunk-text";

describe("chunkText", () => {
  test("splits on whitespace, keeping trailing spaces attached to the word before them", () => {
    const chunks = chunkText("Hello there, friend");
    expect(chunks).toEqual(["Hello ", "there, ", "friend"]);
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
      expect(chunkText(text).join("")).toBe(text);
    }
  });

  test("returns an empty array for empty input", () => {
    expect(chunkText("")).toEqual([]);
  });

  test("never produces an empty-string chunk", () => {
    const chunks = chunkText("a  b   c");
    expect(chunks.every((chunk) => chunk.length > 0)).toBe(true);
  });
});
