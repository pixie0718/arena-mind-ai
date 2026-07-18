"use client";

import { useAtom } from "jotai";
import { Check, Languages } from "lucide-react";
import { preferredLanguageAtom } from "@/store/session";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

/**
 * Same `preferredLanguageAtom` the Profile page's `LanguageSelector`
 * writes to — this is just a second, faster place to reach the same
 * setting without leaving the conversation. Changing it here updates
 * every subsequent request immediately, exactly as it does from Profile.
 */
export function ChatLanguageSwitcher() {
  const [language, setLanguage] = useAtom(preferredLanguageAtom);
  const current = LANGUAGES.find((lang) => lang.code === language) ?? LANGUAGES[0];

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Change language, current: ${current.label}`}
            className="size-12"
          />
        }
      >
        <Languages className="size-4" />
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-0.5">
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                aria-pressed={isActive}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  "flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                  isActive ? "bg-secondary/15 text-secondary" : "text-foreground hover:bg-muted",
                )}
              >
                {lang.label}
                {isActive && <Check className="size-4" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
