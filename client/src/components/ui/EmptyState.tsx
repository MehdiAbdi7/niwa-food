interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = "icon-[mdi--tray-remove]",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-subtle bg-surface/50 px-6 py-14 text-center">
      <span className={`${icon} text-4xl text-foreground/30`} />
      <div className="flex flex-col gap-1">
        <p className="font-heading text-base font-bold text-foreground">
          {title}
        </p>
        {description && (
          <p className="text-sm text-foreground/75">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
