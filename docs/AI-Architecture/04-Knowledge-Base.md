
# 04. Knowledge Base Architecture

Version: 1.0

## Overview
The Knowledge Base (KB) is the trusted source of structured information used by ArenaMind AI.
Instead of relying on the LLM's memory, every user request should retrieve relevant data from the KB first and then generate a grounded response.

## Goals
- Ground AI responses with trusted data
- Keep the MVP backend-light
- Allow future replacement of JSON with APIs
- Support modular stadium-specific content

## Directory Structure

```text
src/
  knowledge/
    stadiums/
      metlife.json
      azteca.json
    routes/
    vendors/
    matches/
    facilities/
    transport/
    accessibility/
    faq/
```

## Collection Schema

### stadiums
- id
- name
- city
- country
- gates
- sections
- emergency_points

### facilities
- id
- stadium_id
- type
- name
- floor
- coordinates

### vendors
- id
- name
- category
- location
- menu

### matches
- id
- stadium_id
- date
- kickoff
- home_team
- away_team

## Retrieval Flow

```text
User Message
      ↓
Intent Detection
      ↓
Relevant Collection
      ↓
Filter Records
      ↓
Provide Context To AI
      ↓
Generate Response
```

## Example

User:
> "Where is Gate B?"

Flow:
1. Detect navigation intent
2. Load stadium metadata
3. Find Gate B
4. Pass structured result to AI
5. Generate concise answer

## Principles

- Never hallucinate venue facts.
- Prefer KB over model knowledge.
- Return "unknown" instead of guessing.
- Keep each collection independent.
- Version JSON files with Git.

## Future Migration

JSON → SQLite → PostgreSQL → Live Stadium APIs

The retrieval interface should remain unchanged so storage can evolve without changing AI logic.
