"use client";

import { useTheme } from "@/features/theme/useTheme";

const OPTIONS: { value: "light" | "dark" | "system"; label: string; icon: string }[] = [
  { value: "light", label: "Clair", icon: "icon-[mdi--white-balance-sunny]" },
  { value: "dark", label: "Sombre", icon: "icon-[mdi--moon-waning-crescent]" },
  { value: "system", label: "Système", icon: "icon-[mdi--theme-light-dark]" },
];

export function AppearanceCard() {
  const { mode, setTheme } = useTheme();

  return (
    <section className="surface-card flex flex-col gap-4 p-5">
      <h2 className="font-heading text-base font-bold text-foreground">Apparence</h2>

      <div className="flex gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition-colors ${
              mode === option.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border-subtle text-foreground/75"
            }`}
          >
            <span className={`${option.icon} text-xl`} />
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
