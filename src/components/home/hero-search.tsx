"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Goal, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    const destination = trimmed
      ? `/chat?q=${encodeURIComponent(trimmed)}`
      : "/chat";
    router.push(destination);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-white/10 bg-card/70 px-4 py-3.5 shadow-sm backdrop-blur-xl",
        "focus-within:ring-2 focus-within:ring-primary/40",
      )}
    >
      <span className="glow-secondary flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
        <Goal className="size-4" aria-hidden="true" />
      </span>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ask ArenaMind anything… “Take me to my seat”"
        aria-label="Ask ArenaMind AI"
        className="min-w-0 flex-1 truncate bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        aria-label="Send"
        className="glow-primary flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
      >
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
