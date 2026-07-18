"use client";

import { CompassIcon, TriangleAlert } from "lucide-react";

export interface NavigationErrorStateProps {
  message: string;
  suggestions?: { id: string; label: string }[];
  onSuggestedAction?: (prompt: string) => void;
  suggestionPrompt?: (label: string) => string;
}

export function NavigationErrorState({
  message,
  suggestions,
  onSuggestedAction,
  suggestionPrompt,
}: NavigationErrorStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-card/40 p-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
        <TriangleAlert className="size-5" aria-hidden="true" />
      </span>
      <p className="max-w-xs text-sm font-medium text-muted-foreground">{message}</p>

      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() =>
                onSuggestedAction?.(
                  suggestionPrompt ? suggestionPrompt(suggestion.label) : `Where is ${suggestion.label}?`,
                )
              }
              className="flex min-h-12 items-center gap-1 rounded-full border border-secondary/40 bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/20 active:scale-95"
            >
              <CompassIcon className="size-3" aria-hidden="true" />
              {suggestion.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
