"use client";

import Link from "next/link";
import { RotateCcw, Goal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatLanguageSwitcher } from "@/features/chat/components/chat-language-switcher";

interface ChatHeaderProps {
  onClear: () => void;
}

export function ChatHeader({ onClear }: ChatHeaderProps) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-card/70 px-4 py-3 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80">
        <span className="glow-secondary flex size-7 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
          <Goal className="size-3.5" />
        </span>
        <div className="flex flex-col leading-tight">
          <h1 className="font-heading text-base tracking-wide text-foreground">ArenaMind Assistant</h1>
          <span className="text-[11px] text-muted-foreground">Always here to help</span>
        </div>
      </Link>
      <div className="flex items-center gap-1">
        <ChatLanguageSwitcher />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Clear conversation"
          onClick={onClear}
          className="size-12"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>
    </div>
  );
}
