/**
 * Catches the model claiming it lacks information that the deterministic
 * agent actually provided — observed in live testing: given a real,
 * substantive exit route as VERIFIED ANSWER, the model sometimes replied
 * "I'm sorry, I don't have information on..." instead of presenting it,
 * apparently judging the answer an imperfect match for a nuanced phrasing
 * of the question ("fastest exit afterwards") rather than just relaying
 * it. This is worse than adding a fact: it hides a correct one. Prompt
 * instructions alone didn't reliably prevent it, so this is a deterministic,
 * code-level check rather than another instruction the model can ignore —
 * consistent with this app's "the LLM never gets the final say on facts"
 * design. Only fires when the deterministic baseline was NOT itself a
 * refusal (a legitimately-grounded "I don't have that" must still be
 * allowed through).
 *
 * Deliberately dependency-free (pure regex/string logic, no imports) so it
 * can be unit-tested directly without needing to resolve the rest of the
 * AI pipeline's module graph — see `refusal-detector.test.ts`.
 */
export const REFUSAL_PATTERN =
  /\bi(?:'m| am) sorry\b[^.!?]{0,40}\b(?:don't|do not|no)\b|\bi don't have (?:that|this|any|the)?\s*(?:information|data)\b|\bno information (?:is )?available\b|\bnot available (?:right now|at this time)?\b|\bunable to (?:find|provide|help)\b|\bi'?m not seeing\b/i;

/**
 * Streamed model text uses typographic (curly) apostrophes — "don't" comes
 * back as "don’t" (U+2019), never the ASCII "'". `REFUSAL_PATTERN` is
 * written with plain ASCII apostrophes for readability, so both texts are
 * normalized before matching. Without this, the check above silently never
 * matched anything (found live: 4 of 5 false refusals slipped through
 * before this fix, because every one of them used a curly apostrophe).
 */
export function normalizeApostrophes(text: string): string {
  return text.replace(/[‘’]/g, "'");
}

export function isFalseRefusal(generatedText: string, baselineReply: string): boolean {
  return (
    REFUSAL_PATTERN.test(normalizeApostrophes(generatedText)) &&
    !REFUSAL_PATTERN.test(normalizeApostrophes(baselineReply))
  );
}
