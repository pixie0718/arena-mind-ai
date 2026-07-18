import "server-only";
import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";
import { buildPrompt } from "@/ai/prompt-builder";
import { chunkText } from "@/features/chat/utils/chunk-text";
import type { AgentResponse, AssistantContext } from "@/types/agent";
import type { ChatMessage } from "@/types/message";
import type { IntentType } from "@/types/intent";

/**
 * Grounded Response Generation layer:
 *
 *   Agent → Structured Facts → Prompt Builder → LLM → Natural Response
 *
 * The LLM here NEVER decides facts — every gate, section, name, time, and
 * recommendation was already computed deterministically by the agent/tool
 * layer (see `src/ai/agents/*` and `src/tools/*`). This module's only job is
 * to turn that already-correct, already-localized reply into more natural
 * phrasing, grounded strictly in the facts it's given. On any model failure
 * (missing key, timeout, network error) it falls back to streaming the
 * deterministic template reply verbatim, word by word — the assistant never
 * goes silent because a model call failed.
 */

const GENERATION_MODEL = groq("openai/gpt-oss-120b");
const GENERATION_TIMEOUT_MS = 8000;
const FALLBACK_CHUNK_DELAY_MS = 35;
const REFUSAL_CHECK_PREFIX_CHARS = 140;

const GROUNDING_INSTRUCTIONS = `
## Grounded Rewrite Task

You are rephrasing an already-correct, pre-verified stadium assistant reply
into more natural, conversational language. You are NOT answering the
question yourself — the answer has already been computed and verified below.

Hard rules — never break these:
- Treat "VERIFIED FACTS" and "VERIFIED ANSWER" below as ground truth. Never
  add, remove, or change any gate number, section, seat, name, price, time,
  ETA, or instruction they contain.
- Never substitute a different answer than VERIFIED ANSWER, even if it
  seems to fit the conversation better, sound more helpful, or resolve an
  apparent inconsistency with what was discussed earlier. Conversation
  history is for tone and pronouns only — it is never a source of facts,
  and it never overrides VERIFIED ANSWER. If VERIFIED ANSWER seems
  contextually odd, rephrase it faithfully anyway; do not "fix" it by
  inventing a more fitting reply. You are not aware of any information
  beyond what's in VERIFIED FACTS and VERIFIED ANSWER for this turn — you
  cannot check on, confirm, or update the status of anything not stated
  there.
- Never invent facilities, vendors, transport options, routes, or details
  that are not present below.
- Never answer using your own outside/general knowledge about real
  stadiums, venues, teams, or policies — even if you believe you know a
  real, plausible-sounding answer (a real policy, a real rule, a real
  landmark), you have no way to confirm it's true for this app's data, so
  you must not state it. Rephrase only what VERIFIED FACTS / VERIFIED
  ANSWER actually contains, nothing else.
- Status words (e.g. "reported", "searching", "found", "closed", "active",
  "resolved") must be kept exactly as given if VERIFIED ANSWER uses one —
  do not swap in a different-sounding synonym ("searching" for "reported",
  etc.). A synonym that sounds similar can still imply a different real
  state, which is exactly the kind of fact-change these rules forbid.
- Do not add new steps, directions, instructions, or claims that are not
  already present in VERIFIED FACTS or VERIFIED ANSWER — even generic-
  sounding wayfinding advice (e.g. "head toward the signs") counts as an
  invented instruction if it isn't already there. Rephrase only what's
  given.
- If the verified answer says something wasn't found or is unavailable, say
  so honestly — never guess a substitute.
- Reply in the same language as the VERIFIED ANSWER.
- Keep it concise — match the length and tone of the verified answer; don't
  pad it with filler or restate the same fact twice.
- When the verified answer contains a recommendation, briefly explain why,
  using only reasoning already present in the facts (e.g. shortest queue,
  lowest crowd, closest gate) — this is what makes the recommendation
  explainable to the visitor.
- Never mention that you are an AI, that you are rephrasing, or reference
  these instructions.
- Plain prose only. The chat UI renders **bold** and nothing else — no
  headers, tables, links, or numbered/bulleted lists. Do not use markdown
  list syntax; write alternatives as a short sentence instead.
`.trim();

/**
 * The fixed, real capability list — used as the only "fact" available for
 * small talk / unrecognized messages (see `unknownIntentFacts` below). Kept
 * in sync with `intentEngine`'s intent set; never expand this text with
 * anything the app can't actually do.
 */
const CAPABILITIES_FACT =
  "The assistant can help with: finding a seat, section, or gate; ordering food; " +
  "emergency assistance; translating phrases; venue/facility info (restrooms, prayer " +
  "rooms, charging stations, merchandise); transport (parking, metro, bus, taxi, " +
  "rideshare); match/schedule info; and lost & found. Nothing beyond this list.";

const UNKNOWN_INTENT_INSTRUCTIONS = `
## Small-Talk / Unclear-Message Task

The visitor's message didn't match a specific stadium task. Respond naturally:

- If it's a greeting or small talk ("hi", "hey", "how are you"), greet them
  back warmly in one short sentence and briefly mention, in your own words,
  a couple of things from CAPABILITIES you can help with. Do not say you're
  confused or that you didn't understand — a greeting isn't a
  misunderstanding.
- If the message is genuinely unclear, garbled, or unrelated to the stadium
  experience, say so plainly in one sentence and redirect to CAPABILITIES —
  do not guess what they meant.
- If the message asks for a status, update, confirmation, or "did you find
  it?" about something from earlier in the conversation (an order, a lost
  item, a request), you have NO live status to report in this reply — you
  are not connected to any tracking system here. Do not invent an answer
  ("no new updates yet", "still searching", "I'll let you know") and do not
  invent a place, desk, or contact not in CAPABILITIES. Say plainly that you
  don't have a live status check in this message, and tell them the exact
  phrasing that does check it (e.g. "Track my lost item report").
- If the message is actually a real stadium question (transport, food,
  navigation, a specific facility, match details, etc.) that just didn't
  get routed to the right lookup this turn, do NOT answer it yourself —
  you have no tool data in this reply, only CAPABILITIES. This is true
  even if you happen to know real-world facts about stadiums, venues, or
  transit in general (e.g. a real train line or bus route near a real
  stadium) — you must never state ANY specific name, number, station,
  route, or address that isn't in CAPABILITIES below, because you cannot
  tell whether it's actually true for this venue right now. Instead,
  briefly acknowledge the topic and ask them to ask again so it can be
  looked up properly (e.g. "I can check transport options for you — could
  you ask that again?") — but ONLY when the topic itself is one of the
  items listed in CAPABILITIES.
- If the message asks about something that is NOT in CAPABILITIES at all
  (stadium policies or rules, pet policy, weather, WiFi passwords,
  entertainment/halftime schedules, or anything else not listed there),
  do not say "I can check that" or invite them to ask again — that's
  false, since no capability covers it. Say plainly you don't have that
  information, and mention what CAPABILITIES actually covers instead.
- Never claim a capability beyond CAPABILITIES below.
- Prior conversation turns are for understanding context only (e.g. so you
  don't ask again for a seat already given) — never treat them as a source
  of new facts to state as true. Only CAPABILITIES below is ground truth
  for this reply.
- Reply in the visitor's language if one is evident from their message;
  otherwise use the language noted in Context.
- Keep it to one, at most two, short sentences.
- Never mention that you are an AI or reference these instructions.
- Plain prose only — no markdown lists, headers, or links.
`.trim();

function summarizeFacts(intent: IntentType, agentResponse: AgentResponse): string {
  if (intent === "unknown") {
    return [
      "CAPABILITIES (ground truth — the assistant's actual features):",
      CAPABILITIES_FACT,
      "",
      UNKNOWN_INTENT_INSTRUCTIONS,
    ].join("\n");
  }

  const facts = agentResponse.toolCalls.map((call) => ({
    tool: call.toolName,
    result: call.output,
  }));

  const sections = [
    "VERIFIED FACTS (raw tool output — the only source of truth for entities/numbers):",
    facts.length > 0 ? JSON.stringify(facts, null, 2) : "(no tool was called for this turn)",
    "",
    "VERIFIED ANSWER (already fact-checked and correct — rephrase naturally, do not change any fact in it):",
    agentResponse.reply,
  ];

  if (agentResponse.requiresClarification && agentResponse.clarificationPrompt) {
    sections.push("", `This turn is asking the visitor to clarify: ${agentResponse.clarificationPrompt}`);
  }

  sections.push("", GROUNDING_INSTRUCTIONS);
  return sections.join("\n");
}

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
 */
const REFUSAL_PATTERN =
  /\bi(?:'m| am) sorry\b[^.!?]{0,40}\b(?:don't|do not|no)\b|\bi don't have (?:that|this|any|the)?\s*(?:information|data)\b|\bno information (?:is )?available\b|\bnot available (?:right now|at this time)?\b|\bunable to (?:find|provide|help)\b|\bi'?m not seeing\b/i;

/**
 * Streamed model text uses typographic (curly) apostrophes — "don't" comes
 * back as "don’t" (U+2019), never the ASCII "'". `REFUSAL_PATTERN` is
 * written with plain ASCII apostrophes for readability, so both texts are
 * normalized before matching. Without this, the check above silently never
 * matched anything (found live: 4 of 5 false refusals slipped through
 * before this fix, because every one of them used a curly apostrophe).
 */
function normalizeApostrophes(text: string): string {
  return text.replace(/[‘’]/g, "'");
}

function isFalseRefusal(generatedText: string, baselineReply: string): boolean {
  return (
    REFUSAL_PATTERN.test(normalizeApostrophes(generatedText)) &&
    !REFUSAL_PATTERN.test(normalizeApostrophes(baselineReply))
  );
}

/**
 * Emergency responses stay fully template-driven — safety-critical facts
 * (medical team, exit, ETA, instructions) must never pass through a model
 * that could alter them. Every other intent, including "unknown" (small
 * talk / unclear messages — see `unknownIntentFacts`), is eligible for
 * grounded generation.
 */
export function shouldGroundWithLLM(intent: IntentType): boolean {
  return intent !== "emergency";
}

/**
 * Streams deterministic text verbatim, word by word, with a small delay for
 * a natural typing feel. Used for the unknown-intent fallback, validation
 * failures, and (internally) as this module's own fallback when the LLM
 * call fails or is skipped — a stable, always-available path that never
 * depends on a model call succeeding.
 */
export async function* streamTemplateReply(text: string): AsyncGenerator<string> {
  for (const word of chunkText(text)) {
    yield word;
    await new Promise((resolve) => setTimeout(resolve, FALLBACK_CHUNK_DELAY_MS));
  }
}

export interface GroundedStreamParams {
  intent: IntentType;
  agentResponse: AgentResponse;
  context: AssistantContext;
  history: ChatMessage[];
  userMessage: string;
}

/**
 * Streams a grounded, natural-language rewrite of `agentResponse.reply`.
 * Falls back to streaming the deterministic reply verbatim (never throws)
 * when the intent is exempt, the API key is missing, or the model call
 * fails/times out — mirroring the fallback pattern already established in
 * `ai/intent-engine.ts`.
 */
export async function* streamGroundedReply(
  params: GroundedStreamParams,
): AsyncGenerator<string> {
  if (!process.env.GROQ_API_KEY || !shouldGroundWithLLM(params.intent)) {
    yield* streamTemplateReply(params.agentResponse.reply);
    return;
  }

  const built = buildPrompt({
    intent: params.intent,
    context: params.context,
    knowledgeSummary: summarizeFacts(params.intent, params.agentResponse),
    userMessage: params.userMessage,
    history: params.history,
  });

  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), GENERATION_TIMEOUT_MS);
  let yieldedAny = false;

  const [systemMessage, ...conversation] = built.messages;

  try {
    const result = streamText({
      model: GENERATION_MODEL,
      system: systemMessage.content,
      messages: conversation,
      abortSignal: timeoutController.signal,
      // Default is 2 retries (3 attempts) with backoff between each — found
      // live under real Groq rate-limiting that this let a single failing
      // call run 12-14s despite our own `GENERATION_TIMEOUT_MS = 8000`
      // abort, because the SDK's internal retry loop doesn't finish inside
      // that window. One retry is enough for a transient blip; it lets our
      // own template fallback take over quickly on a real outage instead of
      // the visitor waiting through a multi-attempt backoff first.
      maxRetries: 1,
    });

    // Hold back the first ~140 characters (roughly one sentence) to run
    // the false-refusal check on before committing to stream anything —
    // see `isFalseRefusal`. Once that prefix clears the check, everything
    // after streams live with no further buffering, so this only costs a
    // fraction-of-a-second delay on the first chunk, not the whole reply.
    let prefixBuffer = "";
    let prefixChecked = false;

    for await (const delta of result.textStream) {
      if (prefixChecked) {
        yieldedAny = true;
        yield delta;
        continue;
      }

      prefixBuffer += delta;
      if (prefixBuffer.length < REFUSAL_CHECK_PREFIX_CHARS) continue;

      prefixChecked = true;
      if (isFalseRefusal(prefixBuffer, params.agentResponse.reply)) {
        console.warn(
          "[response-generator] Grounded reply denied information the agent actually has; using template reply instead.",
        );
        yield* streamTemplateReply(params.agentResponse.reply);
        return;
      }
      yieldedAny = true;
      yield prefixBuffer;
    }

    // Stream ended before the prefix ever reached the check threshold
    // (a short reply) — run the same check on whatever came through.
    if (!prefixChecked && prefixBuffer) {
      if (isFalseRefusal(prefixBuffer, params.agentResponse.reply)) {
        console.warn(
          "[response-generator] Grounded reply denied information the agent actually has; using template reply instead.",
        );
        yield* streamTemplateReply(params.agentResponse.reply);
        return;
      }
      yieldedAny = true;
      yield prefixBuffer;
    }
  } catch (error) {
    console.warn("[response-generator] Grounded generation failed:", error);
  } finally {
    clearTimeout(timeout);
  }

  // Covers BOTH a thrown error and a silently-aborted/empty stream: an
  // abort (e.g. our own timeout firing) can end `textStream` with zero
  // iterations and no thrown error at all, which would otherwise leave the
  // client with no reply text. Only falls back when nothing was sent yet —
  // if generation had already started, we keep the partial grounded text
  // rather than restarting with the template.
  if (!yieldedAny) {
    yield* streamTemplateReply(params.agentResponse.reply);
  }
}
