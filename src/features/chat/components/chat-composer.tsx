"use client";

import { useRef } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickActionRail } from "@/features/chat/components/quick-action-rail";
import type { ChatStatus } from "@/features/chat/hooks/use-arena-chat";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onQuickAction: (prompt: string) => void;
  status: ChatStatus;
  /**
   * The empty-state welcome screen (`ChatEmptyState`) already renders the
   * same `QUICK_ACTIONS` as a prominent grid — showing the identical
   * actions again here would double every one of them in tab order before
   * a keyboard/screen-reader user ever reaches the message box. Defaults
   * to visible for any composer usage that doesn't pass this (e.g. tests).
   */
  showQuickActions?: boolean;
}

const MAX_TEXTAREA_HEIGHT_PX = 120;

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onQuickAction,
  status,
  showQuickActions = true,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitting" || status === "streaming";

  function handleInput(event: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
    const el = event.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (value.trim() && !busy) {
        onSubmit();
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      }
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-white/10 bg-card/40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2.5 backdrop-blur-xl">
      {showQuickActions && <QuickActionRail layout="rail" onSelect={onQuickAction} disabled={busy} />}
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-card/70 px-3 py-2 shadow-sm backdrop-blur-xl focus-within:ring-2 focus-within:ring-primary/40">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask ArenaMind anything…"
          aria-label="Message ArenaMind AI"
          className="min-h-6 max-h-[120px] flex-1 resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground"
        />
        <Button
          type="button"
          size="icon"
          aria-label="Send message"
          disabled={!value.trim() || busy}
          onClick={onSubmit}
          className="glow-primary size-12 shrink-0 rounded-full"
        >
          <ArrowUp className="size-4" />
        </Button>
      </div>
    </div>
  );
}
