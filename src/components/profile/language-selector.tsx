"use client";

import { useAtom } from "jotai";
import { Languages, Check } from "lucide-react";
import { preferredLanguageAtom } from "@/store/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

/**
 * Sends `language` on every chat request (already threaded through
 * `buildContext` → `AssistantContext.language`) — previously nothing ever
 * set this to anything but the "en" default. Noted in the final summary:
 * no agent currently branches its own reply on `context.language` yet
 * (the translation agent reads the target language from the message text
 * itself, not this preference) — this wires the plumbing honestly without
 * fabricating a behavior change that doesn't exist yet.
 */
export function LanguageSelector() {
  const [language, setLanguage] = useAtom(preferredLanguageAtom);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="size-4 text-secondary" aria-hidden="true" />
          Language
        </CardTitle>
        <CardDescription>Sent with every request as your preferred language.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {LANGUAGES.map((lang) => {
          const isActive = lang.code === language;
          return (
            <button
              key={lang.code}
              type="button"
              aria-pressed={isActive}
              onClick={() => setLanguage(lang.code)}
              className={cn(
                "flex min-h-12 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors active:scale-95",
                isActive
                  ? "glow-secondary border-secondary/40 bg-secondary/15 text-secondary"
                  : "border-white/10 bg-card/70 text-foreground hover:bg-muted",
              )}
            >
              {isActive && <Check className="size-3.5" aria-hidden="true" />}
              {lang.label}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
