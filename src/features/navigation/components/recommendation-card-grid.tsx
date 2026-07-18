"use client";

import { memo } from "react";
import { DoorOpen, Clock, Sparkles, UtensilsCrossed, DoorClosed, Accessibility } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StadiumSectionConfig } from "@/types/stadium-config";

interface RecommendationCardGridProps {
  section: StadiumSectionConfig;
  wheelchairPreferred: boolean;
}

interface Tile {
  icon: typeof DoorOpen;
  label: string;
  value: string;
}

function RecommendationCardGridImpl({ section, wheelchairPreferred }: RecommendationCardGridProps) {
  const tiles: Tile[] = [
    { icon: DoorOpen, label: "Entry gate", value: `Gate ${section.gate}` },
    { icon: Clock, label: "Walking time", value: `${section.walkingTimeMinutes} min` },
  ];
  if (section.nearby.restroom) tiles.push({ icon: Sparkles, label: "Restroom", value: section.nearby.restroom });
  if (section.nearby.food) tiles.push({ icon: UtensilsCrossed, label: "Food nearby", value: section.nearby.food });
  if (section.nearby.exit) tiles.push({ icon: DoorClosed, label: "Emergency exit", value: section.nearby.exit });

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((tile) => (
          <Card
            key={tile.label}
            size="sm"
            className="border-white/10 border-l-2 border-l-primary/60 bg-card/70 backdrop-blur-xl"
          >
            <CardContent className="flex items-start gap-2">
              <tile.icon className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90">
                  {tile.label}
                </span>
                <span className="text-xs leading-snug font-semibold text-foreground">{tile.value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary">Level {section.level}</Badge>
        {section.accessible ? (
          <Badge variant="default">
            <Accessibility className="size-3" aria-hidden="true" />
            Accessible route
          </Badge>
        ) : wheelchairPreferred ? (
          <Badge variant="outline">No accessible route recorded for this section</Badge>
        ) : null}
      </div>
    </div>
  );
}

export const RecommendationCardGrid = memo(RecommendationCardGridImpl);
