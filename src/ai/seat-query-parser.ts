export interface SeatQuery {
  sectionId?: string;
  row?: string;
  seatNumber?: string;
  gate?: string;
}

// Deliberately does NOT include "a"/"an": gates and rows are commonly
// lettered A, B, C... in real stadiums, and this list is checked against
// the captured value case-insensitively — including the articles here
// silently discarded any real "Gate A" or "Row A" as if the keyword had
// matched nothing, sending the visitor back to a generic clarification
// prompt instead of the gate/row they actually named. Found live: "Take
// me to Gate A" failed outright while "Take me to Gate B" worked.
const STOPWORDS = new Set([
  "is",
  "the",
  "my",
  "to",
  "for",
  "at",
  "in",
  "your",
  "with",
  "and",
  "near",
  "by",
  "of",
]);

/**
 * Scans every occurrence of `keyword` in the text (not just the first) and
 * returns the first captured value that survives filtering. Necessary
 * because a phrase like "My seat **is** Section 132... Seat 18" contains
 * the word "seat" twice — the naive first-match approach would capture
 * "is" instead of the actual seat number.
 */
function extractField(text: string, keyword: RegExp): string | undefined {
  for (const match of text.matchAll(keyword)) {
    const value = match[1]?.trim();
    if (value && !STOPWORDS.has(value.toLowerCase()) && /^[a-z0-9]{1,5}$/i.test(value)) {
      return value;
    }
  }
  return undefined;
}

/**
 * Extracts structured section/row/seat/gate fields from flexible natural
 * language ("My seat is Section 132, Row F, Seat 18.", "Take me to Gate
 * B.", "Where is Section 105?"). Pure, regex-based — no LLM call, matching
 * every other piece of NLU in this codebase today (see intent-engine.ts).
 */
/**
 * `(?![a-z])` after each keyword prevents it from matching as a bare
 * prefix of an unrelated longer word — without it, "security threat"
 * would match the "sec" abbreviation (word boundary exists before "sec",
 * but not between "sec" and the "urity" that follows it) and capture
 * "urity" as a bogus section id.
 */
export function parseSeatQuery(text: string): SeatQuery {
  return {
    sectionId: extractField(text, /\b(?:section|sec\.?|block)(?![a-z])\s*[:#]?\s*([a-z0-9]+)\b/gi),
    row: extractField(text, /\brow(?![a-z])\s*[:#]?\s*([a-z0-9]+)\b/gi),
    seatNumber: extractField(
      text,
      /\bseat(?![a-z])\s*(?:number|no\.?|#)?\s*[:#]?\s*([a-z0-9]+)\b/gi,
    ),
    gate: extractField(text, /\bgate(?![a-z])\s*[:#]?\s*([a-z0-9]+)\b/gi)?.toUpperCase(),
  };
}
