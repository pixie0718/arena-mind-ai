# ArenaMind AI

**A GenAI-powered stadium companion for the FIFA World Cup 2026 — Smart Stadiums & Tournament Operations Hackathon.**

ArenaMind AI combines deterministic operational intelligence with grounded Large Language Model response generation. Every operational decision — which gate, which vendor, which exit, which medical team — is computed by plain, auditable logic against a structured knowledge base. A Large Language Model (Groq) is layered on top purely to improve conversational quality: turning an already-correct, already-verified answer into natural, context-aware, streamed language. The result is an assistant that *feels* genuinely conversational without ever being allowed to invent a stadium fact.

---

## Table of Contents

- [Challenge Coverage](#challenge-coverage)
- [Generative AI](#generative-ai)
- [Architecture](#architecture)
- [Hallucination Prevention](#hallucination-prevention)
- [Why This Design](#why-this-design)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Assumptions Made](#assumptions-made)
- [Known Limitations](#known-limitations)
- [Screenshots](#screenshots)
- [Scripts](#scripts)

---

## Challenge Coverage

| Challenge Requirement | ArenaMind AI Implementation |
|---|---|
| Navigation | ✅ Conversational seat, gate, exit, and restroom guidance, backed by an interactive stadium map |
| Crowd Management | ✅ Crowd-aware facility and vendor recommendations, ranked by live-style crowd-level data (demonstration data, clearly labeled in-reply) |
| Accessibility | ✅ Wheelchair-aware routing, keyboard-only operation, ARIA-correct interactive elements, `prefers-reduced-motion` support |
| Transportation | ✅ Parking, metro, bus, taxi, and rideshare recommendations ranked by ETA |
| Sustainability | ✅ Lower-emissions transport options surfaced and explained alongside faster ones (demonstration classification, not a certified emissions model) |
| Multilingual Assistance | ✅ LLM-powered translation of arbitrary phrases, and assistant replies generated in the visitor's preferred language |
| Operational Intelligence | ✅ Central orchestrator that classifies intent, resolves context, and routes to the correct domain agent every turn |
| Real-Time Decision Support | ✅ Recommendations personalized to the visitor's linked seat, stadium, accessibility needs, and recent conversation |

Every row above maps to code that exists in this repository today — see [Architecture](#architecture) for where.

## Generative AI

ArenaMind AI uses a Large Language Model (Groq, `openai/gpt-oss-120b`, via the Vercel AI SDK) in four specific, bounded roles:

1. **Intent Understanding** — classifies a visitor's message into one of eight domain intents, with a keyword-based fallback if the model is unavailable, and a hard-coded safety override that always routes a genuine emergency signal to the Emergency agent regardless of what the classifier returns.
2. **Grounded Response Generation** — rewrites an already-computed, already-correct answer into natural, explainable language, streamed token-by-token to the browser.
3. **Translation** — translates arbitrary visitor phrases in real time (not a fixed phrase list).
4. **Natural, Context-Aware Conversation** — replies reference what's already known about the visitor (linked seat, stadium, accessibility, recent turns) so the assistant never re-asks for information it already has.

**What the LLM does not do:**

- It does **not** decide which gate, vendor, exit, medical team, or transport option to recommend — that is 100% deterministic application logic.
- It does **not** originate stadium facts. Every number, name, and location it phrases comes from a structured knowledge base handed to it as verified input for that turn.
- It is explicitly instructed to never invent operational information — and where it cannot answer honestly, it is required to say so rather than guess.
- It never generates emergency response content — that path is fully template-driven, with zero model involvement.

## Architecture

```
User
  ↓
Intent Engine            (Groq-classified, keyword fallback, hard emergency override)
  ↓
Orchestrator             (context + memory resolution, agent dispatch)
  ↓
Domain Agent              (Navigation · Food · Emergency · Translation ·
                            Venue · Transport · Match · Lost & Found)
  ↓
Tools                     (pure, side-effect-free reads)
  ↓
Knowledge Base            (structured JSON — the only source of truth)
  ↓
Verified Structured Facts (deterministic answer + supporting data)
  ↓
Prompt Builder             (system + agent + context + memory layers)
  ↓
Large Language Model       (Groq — rephrases only, streamed)
  ↓
Grounded Natural Language Response
```

**Why this minimizes hallucination:** the model is invoked *after* every business decision has already been made, and it is given that decision as input rather than being asked to produce it. There is no point in the pipeline where the model is the origin of a fact — it can only reshape facts it was handed. This is the same reason a calculator's display can be trusted even though the person reading it isn't a mathematician: the computation happened somewhere verifiable, and the display is just presentation.

### Example Conversation

A real, multi-turn session — note that the seat linked in turn one is recalled automatically in turn three, with no re-asking:

```
Fan:  My seat is Section 102, Row F, Seat 18
Bot:  Section 102 — Row F, Seat 18 is closest to Gate B.
      Estimated walking time: 4 minutes.

Fan:  I'm hungry, what's nearby?
Bot:  Green Bowl Kitchen is your best bet — about 5 min wait at
      Block C, Level 1. Recommended because it currently has the
      shortest queue and low crowd levels.

Fan:  Someone fainted near me
Bot:  Medical help is being notified. You're at Section 102 —
      Row F, Seat 18. Nearest help: Medical Center North, about
      3 min away. Stay where you are if it's safe to do so.
```

## Hallucination Prevention

| Mechanism | What it does |
|---|---|
| **Tool-first, deterministic routing** | Every agent decision (gate, vendor, exit, medical team) is plain application logic reading the knowledge base — never a model call. |
| **Grounded generation prompts** | The LLM is given the verified answer and raw supporting data for the turn, and is instructed to never add, remove, or change a fact, number, or name. |
| **Emergency stays fully template-driven** | Safety-critical replies (nearest medical team, exit, ETA, instructions) never pass through a model call at all. |
| **Deterministic fallback on any model failure** | A timeout, error, missing API key, or exhausted quota falls back to streaming the deterministic template reply verbatim — the assistant is never silent because a model call failed. |
| **Refusal safety net** | A response is checked against the deterministic baseline before being trusted; if the model claims to lack information the agent actually has, the deterministic answer is used instead. |
| **Status-word and fact locking** | Specific values (order status, gate numbers, ETAs) are explicitly forbidden from being paraphrased into a different-sounding synonym that could imply a different real state. |

## Why This Design?

- **No database required** — a structured, version-controlled JSON knowledge base is sufficient for a single-event, per-venue assistant and keeps every fact auditable in the repository itself.
- **Session-based personalization** — the assistant remembers a visitor's seat, stadium, language, and accessibility preferences for the active session without requiring an account.
- **Grounded AI over free-form AI** — separating fact decisions from language generation is what allows the assistant to be genuinely conversational without the reliability risk of an LLM making operational calls.
- **Tool-driven architecture** — every agent is composed from small, typed, independently testable tools rather than one large prompt, keeping the system's behavior traceable.
- **Modular feature design** — navigation, emergency, and chat are separate feature modules with their own components and types, so a change to one doesn't risk the others.
- **Accessibility-first** — accessibility is handled as a first-class context input (not an afterthought), read by every agent that produces a route or facility recommendation.

## Features

**AI Assistant** — Conversational interface with real-time token streaming, session memory, and multilingual replies (English, Spanish, French).

**Accessibility** — Wheelchair-aware routing, keyboard-only operation, correct ARIA structure, and reduced-motion support throughout, applied automatically from a visitor's saved preferences.

**Knowledge** — A structured, per-stadium JSON knowledge base covering facilities, vendors, routes, transport, matches, and FAQs; the sole source of truth for every fact the assistant states.

### Domain Agents

| Agent | Responsibility |
|---|---|
| Navigation | Seat, section, and gate lookup; nearest-restroom and fastest-exit guidance; drives the interactive stadium map |
| Food | Vendor discovery ranked by queue length and crowd level, menu browsing, simulated ordering |
| Emergency | Category-aware response (medical, fire, security, lost child, crowd, injury, and more) with nearest medical team, exit, and dispatch instructions — highest priority, fully deterministic |
| Translation | Real-time translation of arbitrary phrases via the LLM, with an offline phrasebook fallback |
| Venue | Locates non-food facilities — restrooms, medical centers, prayer rooms, charging stations, merchandise |
| Transport | Parking, metro, bus, taxi, and rideshare options ranked by ETA, with sustainability notes |
| Match | Kickoff time, teams, and competition info for the active stadium |
| Lost & Found | Files and tracks lost-item reports for the active session |

### Knowledge Base

| Category | Contents |
|---|---|
| Stadiums | MetLife Stadium, Hard Rock Stadium, Estadio Azteca — venue metadata and section layout |
| Facilities | Restrooms, medical centers, prayer rooms, charging stations, merchandise (MetLife) |
| Vendors | Food/drink vendors with menus, pricing, and queue/crowd data (MetLife) |
| Routes | Section-to-gate and exit routing data (MetLife) |
| Transport | Parking, metro, bus, taxi, and rideshare options (MetLife) |
| Accessibility | Accessible-route and facility metadata (MetLife) |
| Matches | Demo match schedule across all three stadiums |
| FAQ | General visitor questions |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| AI | Groq (`openai/gpt-oss-120b`) via the Vercel AI SDK (`ai`, `@ai-sdk/groq`) |
| Styling | Tailwind CSS 4, shadcn-style UI primitives |
| State | Jotai |
| Animation | Framer Motion, Three.js / React Three Fiber |
| Validation | Zod |

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Add a Groq API key (free at [console.groq.com](https://console.groq.com) → API Keys) to `.env.local`:
   ```
   GROQ_API_KEY=gsk_...
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) — **Assistant** to chat, **Profile** to set stadium, language, and accessibility preferences.

Without a Groq key (or if its quota is exhausted), the assistant still functions correctly — see [Hallucination Prevention](#hallucination-prevention) and [Known Limitations](#known-limitations).

## Project Structure

```
src/app                  Next.js pages + the streaming /api/chat route
src/ai                   Intent engine, orchestrator, context/memory,
                          prompt builder, grounded response generation
src/ai/agents             One deterministic agent per domain
src/ai/prompts            Per-agent system prompt fragments
src/tools                 Pure, side-effect-free knowledge base reads
src/knowledge              The structured data layer — the only source of facts
src/features               UI feature modules (chat, navigation, emergency)
src/components, src/app   Shared UI, layout, pages
docs/PRD, docs/AI-Architecture   Product and architecture documentation
```

See [`docs/AI-Architecture/02-AI-Architecture.md`](docs/AI-Architecture/02-AI-Architecture.md) for the full architecture writeup and [`GENAI-INTEGRATION-REPORT.md`](GENAI-INTEGRATION-REPORT.md) for the detailed grounding strategy and verification log.

## Testing & Quality Assurance

Verification was performed by actually running the application — live requests against the real streaming endpoint and a real browser — not by inspecting code and assuming behavior.

- **Static checks:** `tsc --noEmit`, ESLint, and a production `next build` all run clean.
- **Accessibility:** keyboard-only navigation and send flow, ARIA structure on interactive elements (including the stadium map), touch-target sizing, and `prefers-reduced-motion` behavior verified.
- **Responsive layout:** verified across mobile, tablet, and desktop breakpoints with zero horizontal overflow.
- **Manual and regression QA:** every agent domain (navigation, food, emergency, translation, venue, transport, match, lost & found) exercised end-to-end, including multi-turn memory recall.
- **Edge-case and malformed-input testing:** malformed/invalid request bodies, missing fields, wrong types, and non-standard HTTP methods all verified to fail safely with no crash.
- **Prompt injection testing:** attempts to exfiltrate the system prompt or API key, or override the assistant's persona, verified to be refused with no leak.
- **Hallucination testing:** deliberately ambiguous and out-of-scope questions (topics with no data in the knowledge base) verified to produce honest "I don't have that" responses rather than fabricated answers.
- **Streaming validation:** real token-by-token delivery confirmed (not simulated), including correct behavior when a model call fails mid-response.

Full findings, including two rounds of adversarial QA, are documented in [`RC1-RELEASE-REPORT.md`](RC1-RELEASE-REPORT.md) and [`GENAI-INTEGRATION-REPORT.md`](GENAI-INTEGRATION-REPORT.md).

## Assumptions Made

- Vendor queues, crowd levels, and walking times are demonstration data, not a live IoT/POS feed — the assistant labels this honestly rather than implying real-time sensors.
- One active stadium at a time, selected from three configured venues (MetLife Stadium, Hard Rock Stadium, Estadio Azteca). MetLife Stadium has full data coverage (facilities, vendors, routes, transport); Hard Rock Stadium and Estadio Azteca currently have stadium and match data only.
- Conversation memory is scoped to the active server-process session — there is no login, database, or cross-device sync in this build.
- The intent classifier reads English input; assistant *output* is generated in the visitor's preferred language.
- Food ordering and lost-item reporting are simulated flows, clearly framed as such in the assistant's replies.
- A shared Groq API key has a daily token quota that can be exhausted under heavy use.

## Known Limitations

- Groq's daily token quota is shared and finite; when exhausted, the assistant automatically falls back to deterministic template replies rather than erroring, but loses varied natural phrasing until quota recovers.
- LLM-based intent classification can occasionally return a different result for an identical repeated message; every path it can land on has been verified to degrade safely rather than hallucinate.
- No automated test suite exists yet — verification is manual and live-request based.

## Screenshots

_Screenshots have not yet been captured for this submission. This section is left as a placeholder rather than populated with unverified content — replace with real captures of the Assistant, Profile, and Emergency flows before final submission if desired._

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
