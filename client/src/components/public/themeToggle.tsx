"use client";

import { useTheme } from "@/features/theme/useTheme";

export function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();
  const isDark = mode === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label="Basculer le thème clair/sombre"
      className="flex h-9 w-9 items-center justify-center border-2 border-foreground/80 rounded-full font-bold bg-primary/20 backdrop-blur-2xl text-foreground/80 transition-colors hover:border-2 hover:border-accent-green hover:text-accent-green"
    >
      {isDark ? (
        <span className="icon-[line-md--moon-filled-to-sunny-filled-loop-transition] size-5 hover:cursor-pointer"></span>
      ) : (
        <span className="icon-[line-md--moon-twotone-loop] size-5"></span>
      )}
    </button>
  );
}
