"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { QUICK_ACTIONS } from "@/constants/quick-actions";

export function QuickActionsGrid() {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        const isEmergency = action.tone === "emergency";

        return (
          <Link
            key={action.id}
            href={`/chat?q=${encodeURIComponent(action.prompt)}`}
            className={cn(
              "group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-3 text-center shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95",
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
            <span className="flex min-h-8 items-center justify-center font-heading text-xs leading-tight tracking-wide text-foreground uppercase">
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
