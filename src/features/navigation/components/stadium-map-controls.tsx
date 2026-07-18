"use client";

import { memo } from "react";
import { Plus, Minus, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StadiumMapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

function StadiumMapControlsImpl({ onZoomIn, onZoomOut, onReset }: StadiumMapControlsProps) {
  return (
    <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 rounded-xl border border-white/10 bg-card/80 p-1.5 backdrop-blur-xl">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-12"
        aria-label="Zoom in"
        onClick={onZoomIn}
      >
        <Plus className="size-4" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-12"
        aria-label="Zoom out"
        onClick={onZoomOut}
      >
        <Minus className="size-4" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-12"
        aria-label="Reset view"
        onClick={onReset}
      >
        <Maximize2 className="size-4" />
      </Button>
    </div>
  );
}

export const StadiumMapControls = memo(StadiumMapControlsImpl);
