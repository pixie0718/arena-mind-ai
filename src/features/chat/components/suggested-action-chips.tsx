"use client";

import { motion } from "framer-motion";
import type { SuggestedAction } from "@/types/agent";
import { cn } from "@/lib/utils";

interface SuggestedActionChipsProps {
  actions?: SuggestedAction[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function SuggestedActionChips({ actions, onSelect, disabled }: SuggestedActionChipsProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pl-9">
      {actions.map((action, index) => (
        <motion.button
          key={`${action.label}-${index}`}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(action.prompt)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          className={cn(
            "flex min-h-12 items-center rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1.5 text-xs font-medium text-secondary backdrop-blur-xl transition-all",
            "hover:bg-secondary/20 hover:shadow-[0_0_12px_oklch(0.8_0.15_85_/_30%)] active:scale-95",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {action.label}
        </motion.button>
      ))}
    </div>
  );
}
