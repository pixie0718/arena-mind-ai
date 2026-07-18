import { atomWithStorage } from "jotai/utils";
import { DEFAULT_STADIUM_ID } from "@/constants/stadium";

export type AccessibilityPreferences = {
  wheelchair: boolean;
  largeText: boolean;
  highContrast: boolean;
  voiceFirst: boolean;
};

/**
 * Matches `AssistantContext["linkedTicket"]` / `SessionMemory["linkedTicket"]`
 * (`src/types/agent.ts` / `src/types/message.ts`) exactly — this atom is a
 * client-side convenience for pre-filling the "My Ticket" form on Profile,
 * not a value sent directly to the server (saving the form re-sends it as
 * a normal chat message, reusing the same parse → resolve → remember path
 * every other seat mention already goes through). Kept shape-identical to
 * the server type anyway so the two can never quietly drift apart.
 */
export type LinkedTicket = {
  stadiumId: string;
  block: string;
  row: string;
  seat: string;
} | null;

const defaultAccessibility: AccessibilityPreferences = {
  wheelchair: false,
  largeText: false,
  highContrast: false,
  voiceFirst: false,
};

export const sessionIdAtom = atomWithStorage<string | null>(
  "arenamind:sessionId",
  null,
);

export const preferredLanguageAtom = atomWithStorage<string>(
  "arenamind:language",
  "en",
);

export const stadiumIdAtom = atomWithStorage<string>(
  "arenamind:stadiumId",
  DEFAULT_STADIUM_ID,
);

export const accessibilityPreferencesAtom =
  atomWithStorage<AccessibilityPreferences>(
    "arenamind:accessibility",
    defaultAccessibility,
  );

export const linkedTicketAtom = atomWithStorage<LinkedTicket>(
  "arenamind:ticket",
  null,
);
