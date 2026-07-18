# ArenaMind AI

A live, in-stadium AI assistant (Next.js) that helps visitors find their seat, order food, get emergency help, translate phrases, and navigate transport — all grounded in the venue's own knowledge base.

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
4. Open [http://localhost:3000](http://localhost:3000).

## Architecture

- `src/app` — Next.js App Router pages and the `/api/chat` route, which streams real model tokens (NDJSON) to the client.
- `src/ai` — the AI pipeline: intent classification (Groq-backed, keyword fallback), agent orchestration, context/memory, prompt building, and grounded response generation.
- `src/ai/agents` — one agent per domain (navigation, food, emergency, translation, venue, transport, match, lost & found). Every agent still computes its answer *deterministically* from tool output — the LLM never picks a gate, vendor, or exit.
- `src/ai/response-generator.ts` — the grounded generation layer: `Agent → Structured Facts → Prompt Builder → LLM → Natural Response`. Takes each agent's deterministic reply plus its raw tool-call data, and streams a natural-language rewrite from Groq that is instructed to never add, remove, or change a fact. Falls back to streaming the deterministic template verbatim if the model call fails, times out, or the intent is exempt — the assistant never goes silent because a model call failed. **Emergency stays fully template-driven** (no LLM call at all) since its facts are safety-critical.
- `src/tools/translation.tool.ts` — translates arbitrary phrases via Groq in real time, with the original small demo phrasebook kept only as an offline fallback.
- `src/tools`, `src/knowledge` — the grounded data layer agents query against; every fact an agent or the LLM references traces back to this layer, never to model knowledge.
- `docs/PRD` and `docs/AI-Architecture` — product and architecture documentation.

See `RC1-RELEASE-REPORT.md` and `GENAI-INTEGRATION-REPORT.md` for QA history and the latest GenAI integration details.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
