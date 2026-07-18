"use client";

import { useAtom } from "jotai";
import { Landmark, Check } from "lucide-react";
import { stadiumIdAtom } from "@/store/session";
import { STADIUMS } from "@/constants/stadium";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * The only UI surface that actually lets a visitor reach `hardrock`/
 * `azteca` — until now they were only reachable by sending `stadiumId`
 * directly in an API request (verified via curl), never through a real
 * click in the app.
 */
export function StadiumSelector() {
  const [stadiumId, setStadiumId] = useAtom(stadiumIdAtom);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="size-4 text-secondary" aria-hidden="true" />
          Stadium
        </CardTitle>
        <CardDescription>Sets which stadium&apos;s map and knowledge base the assistant uses.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {STADIUMS.map((stadium) => {
          const isActive = stadium.id === stadiumId;
          return (
            <button
              key={stadium.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setStadiumId(stadium.id)}
              className={cn(
                "flex min-h-12 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors active:scale-95",
                isActive
                  ? "glow-primary border-primary/40 bg-primary/15 text-primary"
                  : "border-white/10 bg-card/70 text-foreground hover:bg-muted",
              )}
            >
              {isActive && <Check className="size-3.5" aria-hidden="true" />}
              {stadium.name}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
