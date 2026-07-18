"use client";

import { motion } from "framer-motion";
import { Goal } from "lucide-react";

const DOT_DELAYS = [0, 0.12, 0.24];

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <span
        className="glow-secondary flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary/15 text-secondary"
        aria-hidden="true"
      >
        <Goal className="size-3.5" />
      </span>
      <div
        className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-white/10 bg-card/70 px-3.5 py-3 backdrop-blur-xl"
        role="status"
        aria-label="Assistant is typing"
      >
        {DOT_DELAYS.map((delay, index) => (
          <motion.span
            key={index}
            className="size-1.5 rounded-full bg-primary"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}
