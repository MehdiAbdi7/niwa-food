interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  accent?: "mustard" | "green" | "primary" | "bordeaux";
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  mustard: "bg-accent-mustard/15 text-accent-mustard",
  green: "bg-accent-green/15 text-accent-green",
  primary: "bg-primary/15 text-primary",
  bordeaux: "bg-accent-bordeaux/15 text-accent-bordeaux",
};

export function StatCard({
  icon,
  label,
  value,
  accent = "primary",
}: StatCardProps) {
  return (
    <div className="surface-card flex items-center gap-3 p-4 transition-transform duration-200 hover:-translate-y-0.5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ACCENT_CLASSES[accent]}`}
      >
        <span className={`${icon} text-xl`} />
      </div>
      <div className="flex min-w-0 flex-col">
        <p className="truncate font-heading text-xl font-bold text-foreground">
          {value}
        </p>
        <p className="truncate text-xs text-foreground/75">{label}</p>
      </div>
    </div>
  );
}
