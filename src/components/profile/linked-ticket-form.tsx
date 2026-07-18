"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAtom, useAtomValue } from "jotai";
import { Ticket } from "lucide-react";
import { linkedTicketAtom, stadiumIdAtom } from "@/store/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Deliberately does NOT send `linkedTicket` as a new API field — instead
 * it re-sends the ticket as a normal chat message ("My seat is Section
 * 102, Row F, Seat 18."), reusing the exact same parse → resolve →
 * remember pipeline every other seat mention already goes through
 * (`src/ai/seat-query-parser.ts` → `navigation.agent.ts` →
 * `orchestrator.ts`'s `extractLinkedTicket`). A parallel "send the raw
 * ticket object to the server" path would need its own precedence rules
 * against a later, fresher in-chat mention — reusing the existing message
 * path sidesteps that entirely: whichever was said more recently already
 * wins, by design.
 */
export function LinkedTicketForm() {
  const router = useRouter();
  const stadiumId = useAtomValue(stadiumIdAtom);
  const [ticket, setTicket] = useAtom(linkedTicketAtom);
  const [section, setSection] = useState(ticket?.block ?? "");
  const [row, setRow] = useState(ticket?.row ?? "");
  const [seat, setSeat] = useState(ticket?.seat ?? "");

  function handleSave() {
    if (!section.trim()) return;
    setTicket({ stadiumId, block: section.trim(), row: row.trim(), seat: seat.trim() });

    const bits = [
      `Section ${section.trim()}`,
      row.trim() && `Row ${row.trim()}`,
      seat.trim() && `Seat ${seat.trim()}`,
    ]
      .filter(Boolean)
      .join(", ");
    router.push(`/chat?q=${encodeURIComponent(`My seat is ${bits}.`)}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="size-4 text-secondary" aria-hidden="true" />
          My Ticket
        </CardTitle>
        <CardDescription>
          Save your seat once — the assistant remembers it for navigation and emergency requests
          without asking again.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Section
            <input
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="102"
              aria-label="Section"
              className="rounded-lg border border-white/10 bg-card/70 px-2.5 py-1.5 text-sm text-foreground outline-none focus-within:ring-2 focus-within:ring-primary/40"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Row
            <input
              value={row}
              onChange={(e) => setRow(e.target.value)}
              placeholder="F"
              aria-label="Row"
              className="rounded-lg border border-white/10 bg-card/70 px-2.5 py-1.5 text-sm text-foreground outline-none focus-within:ring-2 focus-within:ring-primary/40"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Seat
            <input
              value={seat}
              onChange={(e) => setSeat(e.target.value)}
              placeholder="18"
              aria-label="Seat"
              className="rounded-lg border border-white/10 bg-card/70 px-2.5 py-1.5 text-sm text-foreground outline-none focus-within:ring-2 focus-within:ring-primary/40"
            />
          </label>
        </div>
        <Button
          type="button"
          disabled={!section.trim()}
          onClick={handleSave}
          className="glow-primary min-h-12 w-full"
        >
          Save &amp; Tell Assistant
        </Button>
      </CardContent>
    </Card>
  );
}
