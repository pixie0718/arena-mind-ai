import type { StadiumSectionConfig } from "@/types/stadium-config";

/**
 * The `AgentResponse.metadata` payload the navigation agent attaches to a
 * turn. Consumed client-side by `NavigationMapCard`
 * (`src/features/chat/components/chat-message-bubble.tsx` renders it
 * whenever `message.metadata?.kind === "navigation"`). Imported into the
 * server-only `src/ai/agents/navigation.agent.ts` via `import type` only
 * — erased at compile time, so this feature-owned type never actually
 * ships in the server bundle or creates a runtime dependency.
 */
export interface NavigationTarget {
  kind: "section" | "gate";
  id: string;
  label: string;
}

export interface NavigationFoundPayload {
  kind: "navigation";
  status: "found";
  stadiumId: string;
  target: NavigationTarget;
  section?: StadiumSectionConfig;
  requested: { row?: string; seatNumber?: string };
}

export interface NavigationNotFoundPayload {
  kind: "navigation";
  status: "not_found" | "unsupported_stadium";
  stadiumId: string;
  query?: string;
  reason: "unknown_section" | "unknown_gate" | "unsupported_stadium" | "missing_input";
  suggestions: { id: string; label: string }[];
}

/**
 * Renders the full interactive map with no section pre-focused, so the
 * visitor can tap a section directly instead of typing one — offered as
 * an alternative to the "what's your section number?" text clarification.
 */
export interface NavigationBrowsePayload {
  kind: "navigation";
  status: "browse";
  stadiumId: string;
}

export type NavigationMetadata =
  NavigationFoundPayload | NavigationNotFoundPayload | NavigationBrowsePayload;
