"use client";

import { Select } from "@/components/ui/Select";
import { ORDER_TYPE_ICONS, ORDER_TYPE_LABELS } from "@/lib/orderLabels";
import {
  SORT_OPTIONS,
  type SortValue,
  type TypeFilter,
} from "@/features/history/useHistorySelection";
import { ORDER_TYPES } from "@/types/order";

/**
 * Onglets de filtre, « Tous » en tête.
 *
 * Construit à partir de ORDER_TYPES et non d'une liste recopiée : ajouter un
 * quatrième mode de service côté backend le fera apparaître ici sans toucher à
 * ce fichier.
 *
 * « Tous » a sa propre icône plutôt que d'être un simple libellé : sur la
 * rangée, la forme se reconnaît avant que le mot ne se lise.
 */
const TYPE_TABS: { value: TypeFilter; label: string; icon: string }[] = [
  { value: "all", label: "Tous", icon: "icon-[mdi--view-grid-outline]" },
  ...ORDER_TYPES.map((type) => ({
    value: type as TypeFilter,
    label: ORDER_TYPE_LABELS[type],
    icon: ORDER_TYPE_ICONS[type],
  })),
];

interface HistoryToolbarProps {
  type: TypeFilter;
  search: string;
  sort: SortValue;
  onTypeChange: (type: TypeFilter) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: SortValue) => void;
}

/**
 * Filtres transverses de l'historique : ils s'appliquent quelle que soit la
 * case du calendrier sélectionnée, d'où leur place AU-DESSUS de celui-ci.
 *
 * Le type de commande reste une rangée d'onglets et non un <select> : c'est le
 * filtre le plus utilisé de l'écran, il doit se changer en un geste et montrer
 * en permanence lequel est actif.
 */
export function HistoryToolbar({
  type,
  search,
  sort,
  onTypeChange,
  onSearchChange,
  onSortChange,
}: HistoryToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Scroll horizontal sur mobile : quatre pastilles plus le reste de la
          barre ne tiennent pas sur une ligne de 360 px. */}
      <div
        role="tablist"
        aria-label="Type de commande"
        className="scrollbar-hide flex gap-1.5 overflow-x-auto pb-0.5"
      >
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={type === tab.value}
            onClick={() => onTypeChange(tab.value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
              type === tab.value
                ? "bg-primary text-on-primary"
                : "bg-surface-2 text-foreground/75 hover:text-foreground"
            }`}
          >
            <span aria-hidden="true" className={`${tab.icon} text-base`} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-64">
          <label htmlFor="history-search" className="sr-only">
            Rechercher une commande
          </label>
          <span
            aria-hidden="true"
            className="icon-[mdi--magnify] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-foreground/40"
          />
          <input
            id="history-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="N° de commande ou client..."
            // Piloté par la valeur BRUTE, jamais par la valeur debouncée :
            // retarder l'affichage des caractères tapés donnerait l'impression
            // d'un champ qui rame. Seul l'appel réseau est retardé.
            className="h-11 w-full rounded-xl border border-border-subtle bg-surface pl-10 pr-9 text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-primary"
          />
          {/* Le × natif de input[type=search] n'existe pas sur Firefox ni sur
              la plupart des navigateurs mobiles — une recherche qu'on ne sait
              pas effacer donne l'impression d'un historique amputé. */}
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Effacer la recherche"
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-foreground/45 transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <span aria-hidden="true" className="icon-[mdi--close] text-lg" />
            </button>
          )}
        </div>

        <Select
          id="history-sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortValue)}
          options={SORT_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          className="sm:w-56"
        />
      </div>
    </div>
  );
}
