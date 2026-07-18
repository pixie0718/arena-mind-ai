/**
 * Splits text into chunks that can be streamed one at a time while still
 * reconstructing the original exactly via `chunks.join("")`. Splits after
 * each run of whitespace so words arrive with their trailing space intact.
 */
export function chunkText(text: string): string[] {
  return text.split(/(?<=\s)/).filter((chunk) => chunk.length > 0);
}
