"use client";

import { useAtom } from "jotai";
import { Accessibility } from "lucide-react";
import { accessibilityPreferencesAtom, type AccessibilityPreferences } from "@/store/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TOGGLES: { key: keyof AccessibilityPreferences; label: string; description: string }[] = [
  {
    key: "wheelchair",
    label: "Wheelchair access",
    description: "Prioritizes accessible routes and flags sections without one.",
  },
  { key: "largeText", label: "Large text", description: "Increases text size across the app." },
  {
    key: "highContrast",
    label: "High contrast",
    description: "Stronger outlines on the stadium map for low-vision visibility.",
  },
  { key: "voiceFirst", label: "Voice-first", description: "Optimizes responses for screen readers and voice output." },
];

/**
 * `wheelchair` and `highContrast` already have real, observable effects —
 * read by `StadiumMap`/`RecommendationCardGrid` (accessible-route badge)
 * and the map viewport's `.high-contrast` class — this is simply the
 * first UI that ever sets them (previously permanently `false`/default).
 */
export function AccessibilitySettings() {
  const [preferences, setPreferences] = useAtom(accessibilityPreferencesAtom);

  function toggle(key: keyof AccessibilityPreferences) {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Accessibility className="size-4 text-secondary" aria-hidden="true" />
          Accessibility
        </CardTitle>
        <CardDescription>Applied across chat, the stadium map, and emergency responses.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {TOGGLES.map((toggle_) => {
          const isOn = preferences[toggle_.key];
          return (
            <div key={toggle_.key} className="flex items-center justify-between gap-3 py-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{toggle_.label}</span>
                <span className="text-xs text-muted-foreground">{toggle_.description}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isOn}
                aria-label={toggle_.label}
                onClick={() => toggle(toggle_.key)}
                className="flex h-12 w-12 shrink-0 items-center justify-center"
              >
                <span
                  className={cn(
                    "relative h-7 w-12 rounded-full border transition-colors",
                    isOn ? "glow-primary border-primary/40 bg-primary/70" : "border-white/10 bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-5 rounded-full bg-background shadow transition-transform",
                      isOn ? "translate-x-[22px]" : "translate-x-0.5",
                    )}
                  />
                </span>
              </button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
