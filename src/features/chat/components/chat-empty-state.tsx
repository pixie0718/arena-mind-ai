"use client";

import { motion } from "framer-motion";
import { Goal } from "lucide-react";
import { QuickActionRail } from "@/features/chat/components/quick-action-rail";

interface ChatEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export function ChatEmptyState({ onSelectPrompt }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <span className="glow-secondary flex size-16 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
          <Goal className="size-8" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-secondary">Kickoff</p>
          <h1 className="font-heading bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl leading-none tracking-wide text-transparent">
            Hi, I&apos;m ArenaMind
          </h1>
          <p className="max-w-xs text-sm font-medium text-muted-foreground">
            Your stadium companion. Ask me anything, or try one of these.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05 } },
        }}
      >
        <QuickActionRail layout="grid" onSelect={onSelectPrompt} />
      </motion.div>
    </div>
  );
}
