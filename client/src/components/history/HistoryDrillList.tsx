import { formatDA } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";

interface DrillRow {
  key: string | number;
  label: string;
  count: number;
  totalSales: number;
}

interface HistoryDrillListProps {
  rows: DrillRow[];
  onSelect: (key: string | number) => void;
  emptyLabel: string;
}

export function HistoryDrillList({ rows, onSelect, emptyLabel }: HistoryDrillListProps) {
  if (rows.length === 0) {
    return <EmptyState icon="icon-[mdi--calendar-blank-outline]" title={emptyLabel} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <button
          key={row.key}
          onClick={() => onSelect(row.key)}
          className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface px-4 py-3 text-left transition-colors hover:border-primary"
        >
          <span className="font-heading text-base font-bold text-foreground">
            {row.label}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground/75">
              {row.count} commande{row.count > 1 ? "s" : ""}
            </span>
            <span className="text-sm font-bold text-accent-green">
              {formatDA(row.totalSales)}
            </span>
            <span className="icon-[mdi--chevron-right] text-lg text-foreground/40" />
          </div>
        </button>
      ))}
    </div>
  );
}
