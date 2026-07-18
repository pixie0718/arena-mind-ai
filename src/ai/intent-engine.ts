import { groq } from "@ai-sdk/groq";
import { generateObject, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import type {
  DetectedIntent,
  EmergencyCategory,
  IntentEngine,
  IntentType,
} from "@/types/intent";

const INTENT_TYPES = [
  "navigation",
  "food",
  "emergency",
  "translation",
  "venue",
  "transport",
  "match",
  "lost_found",
  "unknown",
] as const satisfies readonly IntentType[];

const EMERGENCY_CATEGORIES = [
  "medical",
  "fire",
  "security",
  "lost_child",
  "crowd",
  "injury",
  "suspicious_activity",
  "volunteer_request",
  "wheelchair_assistance",
] as const satisfies readonly EmergencyCategory[];

// `.nullable()` rather than `.optional()`: Groq's strict `json_schema` mode
// requires every property to appear in `required`, representing "not
// present" as `null` instead of an absent key.
const classificationSchema = z.object({
  primary: z.enum(INTENT_TYPES),
  secondary: z.array(z.enum(INTENT_TYPES)),
  confidence: z.number().min(0).max(1),
  emergencyCategory: z.enum(EMERGENCY_CATEGORIES).nullable(),
});

const LLM_TIMEOUT_MS = 6000;

const CLASSIFIER_SYSTEM_PROMPT = `You classify a stadium visitor's message into exactly one primary intent for ArenaMind AI, a live in-stadium assistant.

Intents:
- navigation: seats, sections, gates, restrooms, exits, elevators, directions inside the venue.
- food: ordering food/drinks, vendors, menus.
- emergency: medical issues, injuries, fire, security threats, suspicious activity, a lost child, crowd crush/stampede, needing a volunteer/staff, wheelchair/mobility assistance. Always prefer emergency when there is a real safety signal, even if the message also mentions a location.
- translation: asking to translate/say a phrase in another language.
- venue: non-food facilities — prayer room, charging stations, water stations, merchandise.
- transport: parking, taxi/rideshare, metro, bus, shuttle, getting to or from the stadium.
- match: score, lineup, kickoff time, who is playing.
- lost_found: lost or found items (not a lost child — that is emergency/lost_child).
- unknown: greetings, small talk, or anything that doesn't fit above.

You may be given RECENT CONVERSATION for context. Use it only to resolve an
otherwise-ambiguous follow-up — e.g. "any update on that?" right after a
lost-item report should classify as lost_found, "how about the other one?"
right after a food recommendation should stay food. Never let it override an
explicit signal in the current message itself, and ignore it entirely if the
current message is a self-contained new request.

Return primary (best single intent), secondary (other plausible intents ranked by likelihood, may be empty), confidence (0-1, how sure you are about primary), and emergencyCategory (ONLY when primary is "emergency", picking the closest matching category).`;

/**
 * Declared before `INTENT_KEYWORDS` so the top-level `emergency` list can
 * be derived from it — previously these were two independently
 * hand-maintained lists that had already drifted apart (e.g. "unconscious"
 * was a medical sub-keyword but wasn't in the top-level `emergency` list,
 * so a message containing only "unconscious" wouldn't even route to the
 * emergency intent). Deriving one from the other makes that drift
 * impossible. Deliberately excludes "exit" from every category — "exit"
 * is navigation's word ("What's the fastest exit?" must keep routing to
 * navigation, not emergency).
 */
const EMERGENCY_KEYWORDS: Record<EmergencyCategory, string[]> = {
  medical: ["collapsed", "fainted", "unconscious", "medical", "sick", "heart attack", "seizure", "can't breathe", "chest pain"],
  injury: ["injured", "injury", "hurt", "bleeding", "broken bone", "sprained", "twisted ankle", "fell down"],
  fire: ["fire", "smoke", "burning", "flames"],
  security: ["fight", "threat", "weapon", "gun", "knife", "attacked", "security"],
  suspicious_activity: ["suspicious", "suspicious package", "suspicious bag", "unattended bag", "strange behavior"],
  lost_child: ["lost child", "missing child", "my kid is missing", "can't find my son", "can't find my daughter"],
  crowd: ["stampede", "crowd crush", "overcrowded", "trampled", "crushed", "too crowded"],
  volunteer_request: ["need a volunteer", "volunteer", "need staff", "staff help", "need assistance"],
  wheelchair_assistance: ["wheelchair", "mobility assistance", "need a wheelchair", "can't walk", "mobility scooter"],
};

const GENERIC_EMERGENCY_KEYWORDS = ["emergency", "help", "urgent", "sos", "911"];

/**
 * Keyword heuristic used as the fallback classifier when the Groq call
 * fails, plus the source of truth for the hard emergency safety override.
 * Every entry must cover all non-"unknown" intent types — the `Record`
 * type enforces that at compile time.
 */
const INTENT_KEYWORDS: Record<Exclude<IntentType, "unknown">, string[]> = {
  navigation: [
    "seat",
    "section",
    "block",
    "gate",
    "restroom",
    "toilet",
    "exit",
    "elevator",
    "find my way",
    "route",
    "direction",
  ],
  food: ["hungry", "food", "eat", "order", "burger", "pizza", "drink", "snack"],
  emergency: [...GENERIC_EMERGENCY_KEYWORDS, ...Object.values(EMERGENCY_KEYWORDS).flat()],
  translation: ["translate", "language", "speak", "say this in"],
  venue: [
    "prayer room",
    "charging",
    "water station",
    "merchandise",
    "facility",
  ],
  transport: [
    "transport",
    "transportation",
    "parking",
    "taxi",
    "uber",
    "metro",
    "bus",
    "shuttle",
    "ride",
    "rideshare",
    "way home",
    "get to the stadium",
    "get here",
    "way to the stadium",
    "get back",
    "way back",
    "back home",
  ],
  match: [
    "score",
    "lineup",
    "kickoff",
    "match",
    "who scored",
    "halftime",
    "playing today",
    "who is playing",
  ],
  lost_found: ["lost my", "lost item", "lost an item", "lost a ", "found", "missing", "left my"],
};

/**
 * Scores each intent by the total character length of its matched
 * keywords rather than a raw hit count. This favors longer, more specific
 * phrases (e.g. "translate", "restroom") over short, generic words that
 * happen to co-occur in an unrelated sentence (e.g. "exit" appearing
 * inside a translation request) — a cheap way to reduce false ties
 * without the complexity of real NLU.
 */
function scoreIntents(normalized: string): Partial<Record<IntentType, number>> {
  const scores: Partial<Record<IntentType, number>> = {};

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [
    IntentType,
    string[],
  ][]) {
    const matched = keywords.filter((keyword) => normalized.includes(keyword));
    const weight = matched.reduce((sum, keyword) => sum + keyword.length, 0);
    if (weight > 0) scores[intent] = weight;
  }

  return scores;
}

/**
 * Scored the same way `scoreIntents` scores intents (summed matched-
 * keyword length, highest wins) rather than the previous first-match
 * approach — first-match meant a message matching multiple categories'
 * keywords always resolved to whichever category happened to be declared
 * first in `EMERGENCY_KEYWORDS`, regardless of which match was more
 * specific.
 */
function detectEmergencyCategory(normalized: string): EmergencyCategory | undefined {
  const scores: Partial<Record<EmergencyCategory, number>> = {};

  for (const [category, keywords] of Object.entries(EMERGENCY_KEYWORDS) as [
    EmergencyCategory,
    string[],
  ][]) {
    const matched = keywords.filter((keyword) => normalized.includes(keyword));
    const weight = matched.reduce((sum, keyword) => sum + keyword.length, 0);
    if (weight > 0) scores[category] = weight;
  }

  const ranked = (Object.entries(scores) as [EmergencyCategory, number][]).sort(
    (a, b) => b[1] - a[1],
  );

  return ranked[0]?.[0];
}

/**
 * True when the message matches a category-SPECIFIC emergency keyword
 * (e.g. "fire", "collapsed", "threat") — not just a generic word like
 * "help", which is too common in non-emergency phrasing to force an
 * override on its own.
 */
function hasCategorySpecificEmergencySignal(normalized: string): boolean {
  return Object.values(EMERGENCY_KEYWORDS).some((keywords) =>
    keywords.some((keyword) => normalized.includes(keyword)),
  );
}

/**
 * Classifies raw user input into a primary intent (plus runner-ups) using
 * keyword matching, WITHOUT the emergency safety override (that's applied
 * uniformly by `applySafetyOverride` regardless of which classifier — this
 * or the LLM — produced the base result). Used as the fallback when the
 * LLM classifier errors, times out, or returns malformed output, and as
 * the sole classifier if no model call was possible.
 */
function detectByKeywords(input: string): DetectedIntent {
  const normalized = input.toLowerCase();
  const scores = scoreIntents(normalized);

  const ranked = (Object.entries(scores) as [IntentType, number][]).sort(
    (a, b) => b[1] - a[1],
  );

  const primary = ranked[0]?.[0] ?? "unknown";
  const secondary = ranked.slice(1).map(([intent]) => intent);
  const confidence = ranked[0] ? Math.min(1, ranked[0][1] / 10) : 0;

  return {
    primary,
    secondary,
    confidence,
    emergencyCategory: primary === "emergency" ? detectEmergencyCategory(normalized) : undefined,
    rawInput: input,
  };
}

/**
 * Emergency is documented as the highest-priority agent in the system
 * (src/ai/prompts/system.md). A message that names a specific emergency
 * category — "Fire in Section 205!" — must route to Emergency regardless
 * of what either classifier decided on its own; this hard keyword-based
 * override is the safety net that keeps working even if the LLM
 * misclassifies or is unavailable. Applied identically on top of both the
 * keyword classifier's and the LLM classifier's output.
 */
function applySafetyOverride(normalized: string, detected: DetectedIntent): DetectedIntent {
  if (detected.primary !== "emergency" && hasCategorySpecificEmergencySignal(normalized)) {
    const secondary = [
      detected.primary,
      ...detected.secondary.filter((intent) => intent !== "emergency"),
    ].filter((intent) => intent !== "unknown");

    return {
      ...detected,
      primary: "emergency",
      secondary,
      confidence: Math.max(detected.confidence, 0.9),
      emergencyCategory: detectEmergencyCategory(normalized),
    };
  }

  if (detected.primary === "emergency" && !detected.emergencyCategory) {
    return { ...detected, emergencyCategory: detectEmergencyCategory(normalized) };
  }

  return detected;
}

const intentClassificationModel = groq("openai/gpt-oss-120b");

/**
 * Calls the LLM for structured intent classification. Returns `null` (never
 * throws) on any failure — missing/invalid API key, timeout, network error,
 * or malformed model output — so the caller can fall back to the keyword
 * classifier and keep the assistant working through a model outage.
 */
async function classifyWithGroq(
  input: string,
  recentContext?: string,
): Promise<DetectedIntent | null> {
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), LLM_TIMEOUT_MS);
  const prompt = recentContext
    ? `RECENT CONVERSATION (context only — see system prompt for how to use this):\n${recentContext}\n\nCurrent message: ${input}`
    : input;

  try {
    const { object } = await generateObject({
      model: intentClassificationModel,
      schema: classificationSchema,
      system: CLASSIFIER_SYSTEM_PROMPT,
      prompt,
      abortSignal: timeoutController.signal,
      // See the matching comment in ai/response-generator.ts — the SDK's
      // default (2 retries / 3 attempts with backoff) can run past our own
      // timeout under sustained rate-limiting, delaying the keyword-based
      // fallback longer than necessary.
      maxRetries: 1,
    });

    return {
      primary: object.primary,
      secondary: object.secondary.filter((intent) => intent !== object.primary),
      confidence: object.confidence,
      emergencyCategory:
        object.primary === "emergency" ? (object.emergencyCategory ?? undefined) : undefined,
      rawInput: input,
    };
  } catch (error) {
    const reason =
      error instanceof NoObjectGeneratedError
        ? `model returned malformed output: ${error.message}`
        : error;
    console.warn("[intent-engine] Groq classification failed, falling back to keywords:", reason);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Classifies raw user input into a primary intent (plus runner-ups).
 * Tries the Groq-backed classifier first; falls back to the keyword
 * heuristic on any model failure so the assistant degrades gracefully
 * instead of breaking. The hard emergency-keyword safety override is
 * applied to whichever result wins.
 */
async function detect(input: string, recentContext?: string): Promise<DetectedIntent> {
  const normalized = input.toLowerCase();
  // The keyword fallback stays context-free by design — it's the safety
  // net for when the model call itself is unavailable, and a plain keyword
  // scan over `recentContext` would risk the wrong kind of false positive
  // (e.g. an old message mentioning "fire" bleeding into an unrelated
  // follow-up). Context-aware disambiguation is a model-only capability.
  const base = (await classifyWithGroq(input, recentContext)) ?? detectByKeywords(input);
  return applySafetyOverride(normalized, base);
}

/** Interface-shaped export so the orchestrator can depend on `IntentEngine`
 * rather than a concrete function, keeping the classifier swappable. */
export const intentEngine: IntentEngine = { detect };

export { detect as detectIntent, detectByKeywords };
