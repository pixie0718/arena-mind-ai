import type { AgentResponse } from "@/types/agent";

export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

const BANNED_PATTERNS: { pattern: RegExp; issue: string }[] = [
  { pattern: /api[_-]?key/i, issue: "Response may leak an API key reference." },
  { pattern: /system prompt/i, issue: "Response may reveal the internal system prompt." },
  { pattern: /as an ai language model/i, issue: "Response breaks the ArenaMind persona." },
];

const MAX_REPLY_LENGTH = 2000;

/**
 * Guards every agent response before it reaches memory or the user. Pure
 * and synchronous today because there's no model output to check yet —
 * once real AI responses exist, extend this with grounding checks (e.g.
 * verify referenced facilities/vendors exist in the knowledge base) per
 * docs/AI-Architecture/02-AI-Architecture.md → AI Safety Principles.
 */
export function validateResponse(response: AgentResponse): ValidationResult {
  const issues: string[] = [];

  if (!response.reply || response.reply.trim().length === 0) {
    issues.push("Response reply is empty.");
  }

  if (response.reply.length > MAX_REPLY_LENGTH) {
    issues.push("Response exceeds the recommended length for a chat bubble.");
  }

  for (const { pattern, issue } of BANNED_PATTERNS) {
    if (pattern.test(response.reply)) {
      issues.push(issue);
    }
  }

  return { valid: issues.length === 0, issues };
}
