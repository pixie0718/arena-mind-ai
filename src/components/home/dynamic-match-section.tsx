"use client";

import { useAtomValue } from "jotai";
import { stadiumIdAtom } from "@/store/session";
import { getStadium, getUpcomingMatch } from "@/lib/knowledge";
import { UpcomingMatchCard } from "@/components/home/upcoming-match-card";

/**
 * Reads the SAME `stadiumIdAtom` the chat pipeline reads (see
 * `use-arena-chat.ts`) so the homepage never shows stale/hardcoded
 * MetLife content once a visitor switches stadiums on Profile — the
 * match card always reflects whichever stadium the assistant is
 * currently grounded in. Client component because `stadiumIdAtom` is a
 * client-persisted Jotai atom; `getStadium`/`getUpcomingMatch`
 * (`src/lib/knowledge.ts`) read bundled JSON synchronously with no
 * server-only restriction, so this needs no new API route.
 */
export function DynamicMatchSection() {
  const stadiumId = useAtomValue(stadiumIdAtom);
  const stadium = getStadium(stadiumId);
  const match = getUpcomingMatch(stadiumId);

  if (!stadium || !match) return null;

  return <UpcomingMatchCard stadium={stadium} match={match} />;
}
