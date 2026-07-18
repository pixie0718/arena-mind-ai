import { CalendarClock, MapPin, Trophy, DoorOpen, LayoutGrid } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Match, Stadium } from "@/types/knowledge";

export function UpcomingMatchCard({ match, stadium }: { match: Match; stadium: Stadium }) {
  return (
    <Card className="relative gap-3 overflow-hidden rounded-2xl border-white/10 bg-gradient-to-br from-card via-card to-primary/10 p-5 text-card-foreground shadow-sm">
      <div
        className="pointer-events-none absolute -right-10 -top-16 size-40 rounded-full bg-primary/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-14 -left-10 size-32 rounded-full bg-secondary/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary">
        <Trophy className="size-3.5" aria-hidden="true" />
        {match.competition}
      </div>
      <p className="font-heading relative text-2xl tracking-wide text-foreground uppercase">
        {match.homeTeam} <span className="text-primary">vs</span> {match.awayTeam}
      </p>
      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarClock className="size-4" aria-hidden="true" />
          {match.date} · {match.kickoff}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-4" aria-hidden="true" />
          {stadium.name}, {stadium.city}
        </span>
      </div>

      <div className="relative flex items-center gap-x-4 gap-y-1 border-t border-white/10 pt-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <DoorOpen className="size-3.5" aria-hidden="true" />
          {stadium.gates.length} gates
        </span>
        <span className="flex items-center gap-1.5">
          <LayoutGrid className="size-3.5" aria-hidden="true" />
          {stadium.sections.length} sections
        </span>
      </div>
    </Card>
  );
}
