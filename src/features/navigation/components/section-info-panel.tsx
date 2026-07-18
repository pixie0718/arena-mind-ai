"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StadiumSectionConfig } from "@/types/stadium-config";
import { buildWalkingDirections } from "@/features/navigation/utils/format-nearby";

interface SectionInfoPanelProps {
  section: StadiumSectionConfig;
  requested: { row?: string; seatNumber?: string };
  onBack: () => void;
}

export function SectionInfoPanel({ section, requested, onBack }: SectionInfoPanelProps) {
  const hasSeatDetail = requested.row || requested.seatNumber;
  const directions = buildWalkingDirections(section);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-card/90 p-3.5 backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">{section.label}</span>
          {hasSeatDetail ? (
            <span className="text-xs text-muted-foreground">
              {[requested.row && `Row ${requested.row}`, requested.seatNumber && `Seat ${requested.seatNumber}`]
                .filter(Boolean)
                .join(", ")}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Add your row and seat number for exact seat details.
            </span>
          )}
        </div>
        <Button type="button" size="icon-sm" variant="ghost" className="size-12" aria-label="Back to section view" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
      </div>

      <ol className="mt-2.5 flex flex-col gap-1 text-xs text-muted-foreground">
        {directions.map((step, index) => (
          <li key={index} className="flex gap-1.5">
            <span className="text-secondary">{index + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
    </motion.div>
  );
}
