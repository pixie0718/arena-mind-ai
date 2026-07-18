"use client";

import { QUICK_ACTIONS } from "@/constants/quick-actions";
import { cn } from "@/lib/utils";

interface QuickActionRailProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  layout?: "rail" | "grid";
}

/**
 * Renders the app-wide `QUICK_ACTIONS` list, but (unlike the home page's
 * `quick-actions-grid.tsx`, which navigates to `/chat?q=...`) calls
 * `onSelect` directly since we're already on the chat screen.
 */
export function QuickActionRail({ onSelect, disabled, layout = "rail" }: QuickActionRailProps) {
  if (layout === "grid") {
    return (
      <div className="grid grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          const isEmergency = action.tone === "emergency";
          return (
            <button
              key={action.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(action.prompt)}
              className={cn(
                "group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-3 text-center shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95",
                "disabled:pointer-events-none disabled:opacity-50",
                isEmergency
                  ? "border-destructive/30 bg-destructive/10 hover:shadow-[0_0_14px_oklch(0.7_0.19_22_/_35%)]"
                  : "hover:shadow-[0_0_14px_oklch(0.8_0.15_85_/_25%)]",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100",
                  isEmergency ? "bg-destructive" : "bg-secondary",
                )}
              />
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl ring-1 ring-inset",
                  isEmergency
                    ? "bg-destructive/15 text-destructive ring-destructive/25"
                    : "bg-secondary/15 text-secondary ring-secondary/25",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="font-heading text-xs leading-tight tracking-wide text-foreground uppercase">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        const isEmergency = action.tone === "emergency";
        return (
          <button
            key={action.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(action.prompt)}
            className={cn(
              "flex min-h-12 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-xl transition-colors",
              "hover:bg-muted active:scale-95",
              "disabled:pointer-events-none disabled:opacity-50",
              isEmergency && "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
