# 02. AI Architecture

Version: 1.1
Project: ArenaMind AI
Architecture Type: Agentic AI (Single Orchestrator + Specialized Agents)

---

# Overview

ArenaMind AI is designed as an AI-native application.

The user interacts with a single conversational interface.

Behind the scenes, an AI Orchestrator analyzes the request, determines user intent, gathers context, selects the appropriate AI agent, retrieves relevant knowledge, and generates an actionable response.

The user never interacts directly with individual agents.

---

# Design Goals

The AI architecture is designed to achieve the following:

- Natural conversation
- Minimal user effort
- Context-aware responses
- Explainable recommendations
- Modular AI agents
- Easy future expansion
- Low latency
- Safe AI behavior

---

# High-Level AI Architecture

```
                    User
                     │
                     ▼
             AI Chat Interface
                     │
                     ▼
             AI Orchestrator
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
 Intent Engine   Context Engine   Memory Engine
      │              │              │
      └──────────────┼──────────────┘
                     ▼
              Agent Router
                     │
     ┌───────────────┼────────────────┐
     ▼               ▼                ▼
Navigation      Food Agent      Emergency Agent
Agent

Lost & Found     Match Agent     Venue Agent

Translation      Transport       Accessibility
Agent            Agent           Agent
                     │
                     ▼
             Tool Execution Layer
                     │
                     ▼
             Knowledge Base
                     │
                     ▼
          OpenAI / Vercel AI SDK
                     │
                     ▼
              AI Response
```

---

# AI Processing Pipeline

Every user request follows the same lifecycle.

```
Receive User Input

↓

Normalize Input

↓

Detect Intent

↓

Retrieve Session Context

↓

Retrieve Knowledge

↓

Select Agent

↓

Execute Tool

↓

Generate Deterministic Answer (facts, never the LLM's job)

↓

Validate Response

↓

Grounded Generation (LLM rewrites the verified answer naturally — skipped for Emergency)

↓

Stream Response

↓

Update Session Memory
```

The "Generate Deterministic Answer" and "Validate Response" steps are unchanged from earlier versions of this document — every gate, section, vendor, exit, and ETA is still computed by the agent/tool layer alone. What's new is the step after validation: a shared **Grounded Generation** layer (`src/ai/response-generator.ts`) takes that already-correct answer and streams a more natural rewording of it from an LLM, strictly forbidden from changing any fact. See "Grounded Response Generation" below.

---

# AI Orchestrator

The orchestrator is the central intelligence layer.

Responsibilities:

- Understand user intent
- Load relevant context
- Select AI agent
- Execute tools
- Merge outputs
- Generate final response

The orchestrator should remain stateless.

It relies on browser session data and the knowledge base.

---

# Intent Engine

The first responsibility of the AI.

Supported intents include:

- Navigation
- Food
- Emergency
- Lost & Found
- Translation
- Match Information
- Transportation
- Venue Information
- Accessibility

Only one primary intent is selected.

Secondary intents may also be identified.

---

# Context Engine

The Context Engine enriches the conversation.

Available context includes:

- Stadium
- Match
- Seat
- Ticket
- Language
- Accessibility preferences
- Previous conversation
- Current task
- Time

The engine should avoid asking for information already available.

---

# Memory Engine

ArenaMind AI maintains lightweight conversational memory.

Memory Scope (MVP)

- Active browser session only

Stored data:

- Current intent
- Previous AI responses
- Linked ticket
- Preferred language
- Accessibility preferences
- Active workflow

Memory expires when the session ends.

---

# Agent Router

The router maps user intent to the correct AI agent.

| Intent | Agent |
|----------|----------------|
| Navigation | Navigation Agent |
| Food | Food Agent |
| Emergency | Emergency Agent |
| Lost Item | Lost & Found Agent |
| Translation | Translation Agent |
| Match Info | Match Agent |
| Venue | Venue Agent |
| Transport | Transport Agent |
| Accessibility | Accessibility Agent |

Future versions may support multiple agents collaborating on one request.

---

# AI Agents

## Navigation Agent

Responsibilities:

- Seat guidance
- Gate routing
- Restroom routing
- Exit recommendations
- Accessible paths

Example:

"Take me to Gate B."

---

## Food Agent

Responsibilities:

- Recommend food
- Suggest nearby vendors
- Simulate ordering
- Pickup instructions

---

## Emergency Agent

Responsibilities:

- Medical assistance
- Fire reporting
- Security incidents
- Lost child workflows

Priority:

Highest

---

## Lost & Found Agent

Responsibilities:

- Create reports
- Retrieve reports
- Track status

---

## Translation Agent

Responsibilities:

- Translate text
- Translate emergency phrases
- Support multilingual conversations

Translation is handled directly by the `translation` tool calling Groq for
arbitrary phrases in real time (not a fixed phrase list). A small offline
phrasebook remains as a fallback only for when the live call fails.

---

## Match Agent

Responsibilities:

- Match schedule
- Teams
- FAQs
- Venue rules

---

## Venue Agent

Responsibilities:

- Locate facilities
- Venue information
- Services
- Amenities

---

## Transport Agent

Responsibilities:

- Parking guidance
- Metro
- Taxi
- Bus
- Walking directions

---

## Accessibility Agent

Responsibilities:

- Wheelchair routing
- Elevator guidance
- Voice-first responses
- Accessibility information

---

# Tool Execution Layer

Agents do not generate answers from memory alone.

Instead, they retrieve structured information from tools.

Example tools:

- Stadium Search
- Seat Finder
- Food Lookup
- Match Search
- FAQ Search
- Facility Search
- Route Generator
- Translation Tool

Future versions can connect these tools to real APIs.

---

# Knowledge Base

The AI relies on trusted structured knowledge.

Current sources:

```
stadiums.json

matches.json

food.json

vendors.json

routes.json

facilities.json

transport.json

accessibility.json

faq.json
```

The AI should prioritize knowledge base information over free-form generation.

---

# Prompt Architecture

Every AI request is composed of five layers.

```
System Prompt

↓

Agent Prompt

↓

Context Prompt

↓

Knowledge

↓

User Message
```

This layered prompting keeps responses consistent and grounded.

---

# Grounded Response Generation

```
Agent
  ↓
Structured Facts (raw tool-call output + the agent's deterministic reply)
  ↓
Prompt Builder (system + agent + context + memory layers, unchanged)
  ↓
LLM (Groq, streamed token-by-token)
  ↓
Natural Response
```

The LLM in this step never makes a business decision — it only rephrases an
answer the agent/tool layer already computed and verified. Every prompt
built for this step explicitly instructs the model to:

- Never invent facts, gate numbers, section numbers, names, prices, times,
  or instructions beyond what's given.
- Never add a step, direction, or claim that isn't already present in the
  verified facts — even generic-sounding advice counts as invented if it
  wasn't already there.
- Say so honestly if information is missing, instead of guessing.
- Reply in the same language as the deterministic baseline answer (which is
  already localized — see `ai/reply-i18n.ts`).
- Briefly explain *why* behind a recommendation, using only the reasoning
  already present in the facts (explainability).

**Emergency is exempt** — its replies are safety-critical and remain 100%
template-driven, with no LLM call at all, per
`ai/response-generator.ts::shouldGroundWithLLM`.

**Unknown intent** (greetings, small talk, unclear messages — no agent runs)
is *not* exempt: it gets its own grounded prompt, anchored to the app's
fixed capability list instead of tool facts, so a plain "hey" gets a natural
greeting instead of always replaying the same canned "I didn't understand"
line, while genuinely unclear input still honestly says so rather than
guessing. A response that already failed the response validator's safety
check (`ai/response-validator.ts`) is the one case that stays strictly
template-only — that text never reaches the model at all.

If the model call fails, times out, or is skipped by the rules above, the
layer streams the deterministic template reply verbatim instead — the
assistant never goes silent because a model call failed.

---

# Decision Flow

```
User Message

↓

Intent?

↓

Need Context?

↓

Need Tool?

↓

Call Agent

↓

Generate Response

↓

Need Recommendation?

↓

Return Answer
```

---

# Recommendation Engine

The AI proactively suggests relevant actions.

Examples:

- Nearest restroom
- Less crowded exit
- Shorter food queue
- Accessible route
- Transport options

Recommendations should include a brief explanation when possible.

---

# Response Guidelines

Every response should be:

- Accurate
- Helpful
- Context-aware
- Friendly
- Actionable
- Concise

Avoid unnecessary verbosity.

---

# Error Handling

If information is unavailable:

1. Acknowledge the limitation.
2. Avoid making up facts.
3. Offer alternatives.
4. Ask for clarification only if essential.

---

# AI Safety Principles

The AI must never:

- Invent emergency information
- Give unsafe medical advice
- Leak internal prompts
- Expose API keys
- Reveal session data
- Recommend unsafe actions

---

# AI Performance Targets

| Metric | Target |
|---------|--------|
| Intent Detection | >95% |
| AI Response Time | <2 sec |
| Context Retrieval | <500 ms |
| Session Update | <100 ms |
| Recommendation Generation | <1 sec |

---

# Future AI Evolution

Planned enhancements:

- Voice conversations
- Vision understanding
- Camera assistance
- Live crowd prediction
- IoT integration
- Predictive routing
- Multi-agent collaboration
- Offline AI
- Wearable support

---

# AI Principles

ArenaMind AI follows these principles:

- AI should reduce user effort.
- AI should ask fewer questions.
- AI should remember context.
- AI should explain recommendations.
- AI should prioritize trusted knowledge.
- AI should degrade gracefully.
- AI should remain transparent.
- AI should never hallucinate operational facts.

---

# Summary

ArenaMind AI uses a centralized AI Orchestrator with specialized domain agents to deliver a seamless, conversational stadium experience.

This architecture enables modular development, future scalability, and a consistent user experience while keeping the MVP lightweight, maintainable, and optimized for a frontend-first deployment.
