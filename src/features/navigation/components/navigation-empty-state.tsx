import { MapPin } from "lucide-react";

export function NavigationEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-card/40 p-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
        <MapPin className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-foreground">Select a stadium to see its map.</p>
    </div>
  );
}
