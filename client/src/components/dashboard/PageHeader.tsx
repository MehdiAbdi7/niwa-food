interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function PageHeader({
  eyebrow = "Espace de travail",
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent-green">
          {eyebrow}
        </p>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-foreground/75">
          {description}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
