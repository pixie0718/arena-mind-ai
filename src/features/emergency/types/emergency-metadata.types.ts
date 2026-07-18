import type { EmergencyCategory } from "@/types/intent";

/**
 * The `AgentResponse.metadata` payload the emergency agent attaches to a
 * turn. Consumed client-side by `EmergencyCard`
 * (`src/features/chat/components/chat-message-bubble.tsx` renders it
 * whenever `message.metadata?.kind === "emergency"`, checked before
 * navigation's `kind === "navigation"` since emergency is the
 * highest-priority intent). Imported into the server-only
 * `src/ai/agents/emergency.agent.ts` via `import type` only — erased at
 * compile time, same pattern already used for navigation's metadata type.
 */
export interface EmergencyLocation {
  stadiumId: string;
  sectionId: string;
  sectionLabel: string;
  row?: string;
  seat?: string;
}

export interface EmergencyResolvedPayload {
  kind: "emergency";
  status: "resolved";
  category: EmergencyCategory | "unspecified";
  location: EmergencyLocation;
  nearestMedicalTeam: { name: string; etaMinutes: number };
  nearestExit: { label: string; gate: string };
  instructions: string;
  contactInstructions: string;
  routingExplanation: string;
  primaryAction: { label: string; prompt: string };
  secondaryAction: { label: string; prompt: string };
  incidentId: string;
}

export interface EmergencyLocationUnknownPayload {
  kind: "emergency";
  status: "location_unknown";
  category: EmergencyCategory | "unspecified";
  instructions: string;
  incidentId: string;
}

export type EmergencyMetadata = EmergencyResolvedPayload | EmergencyLocationUnknownPayload;
