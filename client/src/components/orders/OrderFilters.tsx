"use client";

import { Input } from "@/components/ui/Input";
import type { OrderType } from "@/types/order";
import { ORDER_TYPE_LABELS } from "@/lib/orderLabels";

const TYPE_FILTERS: { value: OrderType | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "dine_in", label: ORDER_TYPE_LABELS.dine_in },
  { value: "takeaway", label: ORDER_TYPE_LABELS.takeaway },
  { value: "delivery", label: ORDER_TYPE_LABELS.delivery },
];

interface OrderFiltersProps {
  typeFilter: OrderType | "all";
  onTypeFilterChange: (value: OrderType | "all") => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function OrderFilters({
  typeFilter,
  onTypeFilterChange,
  search,
  onSearchChange,
}: OrderFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-1.5 overflow-x-auto">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onTypeFilterChange(filter.value)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              typeFilter === filter.value
                ? "bg-primary text-on-primary"
                : "bg-surface-2 text-foreground/75 hover:text-foreground"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <Input
        placeholder="N° commande ou client..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="sm:w-64"
      />
    </div>
  );
}
