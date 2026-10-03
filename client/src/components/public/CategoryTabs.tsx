// src/components/public/CategoryTabs.tsx

import type { ResolvedGroup } from "@/features/menu/useCategoryGroups";

interface CategoryTabsProps {
  groups: ResolvedGroup[];
  selectedLabel: string | null;
  onSelect: (label: string | null) => void;
}

export function CategoryTabs({
  groups,
  selectedLabel,
  onSelect,
}: CategoryTabsProps) {
  return (
    <div>
      {/* Zone scrollable : snap horizontal, scrollbar masquée, bords qui débordent sur mobile */}
      <div className="scrollbar-hide flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-6 pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`shrink-0 snap-start rounded-full px-5 py-4 font-heading text-sm font-bold whitespace-nowrap transition-all duration-200 ease-in-out ${
            selectedLabel === null
              ? "bg-primary text-background shadow-food-sm"
              : "border border-primary text-foreground hover:bg-primary/10"
          }`}
        >
          Tout le menu
        </button>

        {groups.map((group) => (
          <button
            key={group.label}
            type="button"
            onClick={() => onSelect(group.label)}
            className={`shrink-0 snap-start rounded-full px-5 py-2.5 font-heading text-sm font-bold whitespace-nowrap transition-all duration-200 ease-in-out ${
              selectedLabel === group.label
                ? "bg-primary text-background shadow-food-sm"
                : "border border-primary text-foreground hover:bg-primary/10"
            }`}
          >
            {group.label}
          </button>
        ))}
      </div>
    </div>
  );
}
