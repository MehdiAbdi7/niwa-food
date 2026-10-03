"use client";

import { useEffect, useState } from "react";
import {
  formatElapsed,
  getElapsedLevel,
  getElapsedMinutes,
  type ElapsedLevel,
} from "@/lib/elapsedTime";

const LEVEL_CLASSES: Record<ElapsedLevel, string> = {
  normal: "text-foreground/75",
  warning: "text-accent-mustard",
  critical: "text-accent-bordeaux",
};

interface ElapsedTimerProps {
  since: string;
  className?: string;
}

// Se met à jour chaque minute — pas besoin de plus fréquent, et ça évite de
// réveiller inutilement des dizaines de cartes en même temps sur le kanban.
export function ElapsedTimer({ since, className = "" }: ElapsedTimerProps) {
  const [minutes, setMinutes] = useState(() => getElapsedMinutes(since));

  useEffect(() => {
    const interval = setInterval(() => setMinutes(getElapsedMinutes(since)), 60_000);
    return () => clearInterval(interval);
  }, [since]);

  const level = getElapsedLevel(minutes);

  return (
    <span
      className={`flex items-center gap-1 text-xs font-bold ${LEVEL_CLASSES[level]} ${className}`}
    >
      <span className="icon-[mdi--clock-outline] text-sm" />
      {formatElapsed(minutes)}
    </span>
  );
}
