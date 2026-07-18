export type MessageTextSegment = { type: "text" | "bold"; value: string };

/**
 * Minimal `**bold**` segmenter for assistant prose. No markdown library is
 * installed and agent replies are plain templated strings today, so this
 * intentionally does not attempt full markdown — just enough structure to
 * let a reply emphasize a name or number.
 */
export function formatMessageText(content: string): MessageTextSegment[] {
  const segments: MessageTextSegment[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: "bold", value: match[1] });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", value: content.slice(lastIndex) });
  }

  return segments;
}
