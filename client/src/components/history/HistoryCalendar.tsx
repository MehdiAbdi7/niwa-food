"use client";

import { useMemo } from "react";
import { MONTH_NAMES, WEEKDAY_LABELS, buildMonthGrid } from "@/lib/calendar";
import { formatCompactDA, formatDA } from "@/lib/format";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import type {
  HistoryDayEntry,
  HistoryMonthEntry,
  HistoryYearEntry,
} from "@/types/order";

interface HistoryCalendarProps {
  years: HistoryYearEntry[];
  months: HistoryMonthEntry[];
  days: HistoryDayEntry[];
  year: number | null;
  month: number | null;
  day: number | null;
  isLoadingYears: boolean;
  isLoadingMonths: boolean;
  isLoadingDays: boolean;
  onSelectYear: (year: number) => void;
  onToggleMonth: (month: number) => void;
  onToggleDay: (day: number) => void;
}

interface CellStats {
  count: number;
  totalSales: number;
}

/**
 * Deux gabarits, un seul composant.
 *
 * Sous xl, le calendrier est pleine largeur et empilé au-dessus de la liste :
 * les cases sont hautes (56px), confortables au doigt sur la tablette du
 * comptoir.
 *
 * À partir de xl, il vit dans une colonne de 320px à droite de la liste. Les
 * cases descendent à 40px, la police se resserre, et les deux sélecteurs
 * passent l'un sous l'autre. C'est le prix à payer pour que la liste des
 * commandes soit visible SANS défiler — et à la souris, 40px reste une cible
 * très confortable.
 */

/**
 * Une case du calendrier.
 *
 * Trois états, et ils doivent se distinguer AUTREMENT que par la seule
 * couleur : un jour sans vente est `disabled`, donc il ne réagit ni au
 * survol, ni au clic, ni à la tabulation — l'information passe par le
 * comportement, pas uniquement par un gris que tout le monde ne perçoit pas
 * de la même façon.
 *
 * `aria-pressed` plutôt que `aria-current` : ces cases se comportent comme des
 * filtres à bascule, pas comme des liens de navigation.
 */
function CalendarCell({
  label,
  stats,
  isSelected,
  onClick,
  title,
}: {
  label: string;
  stats?: CellStats;
  isSelected: boolean;
  onClick: () => void;
  title?: string;
}) {
  // Conservé dans une variable locale et non recalculé : TypeScript ne sait
  // pas déduire que `stats` est défini à partir d'un booléen intermédiaire,
  // alors qu'il le déduit très bien d'une variable non nulle.
  const activeStats = stats && stats.count > 0 ? stats : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={activeStats === null}
      aria-pressed={isSelected}
      title={
        activeStats
          ? `${title} — ${activeStats.count} commande${activeStats.count > 1 ? "s" : ""} · ${formatDA(activeStats.totalSales)}`
          : `${title} — aucune vente`
      }
      // min-h-14 : à 7 colonnes sur un écran de 360 px une case fait ~44 px de
      // large, on garde donc au moins autant en hauteur pour rester au-dessus
      // de la cible tactile minimale. En colonne latérale (xl), on redescend à
      // 40 px : la souris s'en accommode, et le bloc entier tient à l'écran.
      className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1.5 transition-colors xl:min-h-10 xl:gap-0 xl:rounded-lg xl:px-0 xl:py-1 ${
        isSelected
          ? "border-primary bg-primary text-on-primary shadow-sm"
          : activeStats
            ? "border-border-subtle bg-surface text-foreground hover:border-primary hover:bg-surface-2"
            : "cursor-not-allowed border-transparent bg-surface-2/40 text-foreground/25"
      }`}
    >
      <span className="font-heading text-sm font-bold leading-none xl:text-xs">
        {label}
      </span>

      {/* Le CA n'apparaît que sur les cases actives : afficher « 0 » sur les
          jours de fermeture remplirait la grille de bruit. */}
      {activeStats ? (
        <span
          className={`tabular-nums text-[10px] font-semibold leading-none xl:text-[9px] ${
            isSelected ? "opacity-80" : "text-accent-green"
          }`}
        >
          {formatCompactDA(activeStats.totalSales)}
        </span>
      ) : (
        // Réserve la même hauteur que la ligne de CA, pour que les cases
        // actives et inactives restent parfaitement alignées.
        <span aria-hidden="true" className="h-2.5 xl:h-2" />
      )}
    </button>
  );
}

function CalendarSkeleton({ cells }: { cells: number }) {
  return (
    <div className="grid grid-cols-7 gap-1.5 xl:gap-1">
      {Array.from({ length: cells }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-14 rounded-xl xl:h-10 xl:rounded-lg"
        />
      ))}
    </div>
  );
}

export function HistoryCalendar({
  years,
  months,
  days,
  year,
  month,
  day,
  isLoadingYears,
  isLoadingMonths,
  isLoadingDays,
  onSelectYear,
  onToggleMonth,
  onToggleDay,
}: HistoryCalendarProps) {
  // Map plutôt qu'un .find() dans la boucle de rendu : sur la grille des jours,
  // 31 recherches linéaires à chaque rendu — dont un par frappe dans le champ
  // de recherche. La Map ramène chaque accès à O(1) et n'est reconstruite que
  // lorsque les données changent réellement.
  const dayStats = useMemo(
    () =>
      new Map(
        days.map((entry) => [
          entry.day,
          { count: entry.count, totalSales: entry.totalSales },
        ]),
      ),
    [days],
  );

  // La grille dépend uniquement de l'année et du mois : inutile de la
  // recalculer quand seules les statistiques changent.
  const dayGrid = useMemo(
    () => (year && month ? buildMonthGrid(year, month) : []),
    [year, month],
  );

  if (isLoadingYears) {
    return (
      <section className="surface-card flex flex-col gap-4 p-4 sm:p-5 xl:gap-3 xl:p-3">
        <Skeleton className="h-9 w-48 rounded-full" />
        <CalendarSkeleton cells={12} />
      </section>
    );
  }

  if (years.length === 0) {
    return (
      <section className="surface-card flex flex-col items-center gap-2 p-8 text-center xl:p-5">
        <span
          aria-hidden="true"
          className="icon-[mdi--calendar-blank-outline] text-3xl text-foreground/25"
        />
        <p className="font-heading text-sm font-bold text-foreground">
          Aucune vente enregistrée
        </p>
        <p className="text-sm text-foreground/75">
          Les commandes terminées apparaîtront ici, service après service.
        </p>
      </section>
    );
  }

  return (
    <section className="surface-card flex flex-col gap-4 p-4 sm:p-5 xl:gap-3 xl:p-3">
      {/* Un intitulé de section, visible seulement en colonne latérale : sorti
          du flux principal, le bloc a besoin de dire ce qu'il est. Empilé, sa
          position juste sous les filtres suffisait. */}
      <p className="hidden font-heading text-xs font-bold uppercase tracking-[0.14em] text-foreground/45 xl:block">
        Période
      </p>

      {/* Deux colonnes quand il y a la place, l'une sous l'autre dans la
          colonne latérale : à 320 px, deux <select> côte à côte ne montrent
          plus que « Sept… ». */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 xl:gap-2">
        <Select
          id="history-year"
          label="Année"
          value={year?.toString() ?? ""}
          onChange={(event) => onSelectYear(Number(event.target.value))}
          options={years.map((entry) => ({
            value: entry.year.toString(),
            // « vente » et non « commande » : plus court, et l'historique ne
            // contient que des commandes encaissées.
            label: `${entry.year} · ${entry.count} vente${entry.count > 1 ? "s" : ""}`,
          }))}
        />
        <Select
          id="history-month"
          label="Mois"
          value={month?.toString() ?? ""}
          onChange={(event) => onToggleMonth(Number(event.target.value))}
          disabled={isLoadingMonths || months.length === 0}
          placeholder={isLoadingMonths ? "Chargement..." : "Choisir un mois"}
          // MONTH_NAMES plutôt qu'un Intl.DateTimeFormat construit à chaque
          // ligne : même résultat, sans instancier un formateur par mois.
          options={months.map((entry) => ({
            value: entry.month.toString(),
            label: `${MONTH_NAMES[entry.month - 1]} · ${entry.count} vente${entry.count > 1 ? "s" : ""}`,
          }))}
        />
      </div>

      {/* ---------- Jours ----------
          N'apparaît qu'une fois un mois choisi : afficher une grille de 31
          cases vides sous les mois n'apprendrait rien et doublerait la hauteur
          du bloc sur mobile. */}
      {year !== null && month !== null && (
        <div className="flex flex-col gap-1.5 border-t border-dashed border-border-subtle pt-4 xl:gap-1 xl:pt-3">
          <div className="grid grid-cols-7 gap-1.5 xl:gap-1">
            {WEEKDAY_LABELS.map((label) => (
              <span
                key={label}
                aria-hidden="true"
                className="text-center text-[11px] font-bold uppercase tracking-wide text-foreground/35 xl:text-[10px] xl:tracking-normal"
              >
                {label}
              </span>
            ))}
          </div>

          {isLoadingDays ? (
            <CalendarSkeleton cells={35} />
          ) : (
            <div className="grid grid-cols-7 gap-1.5 xl:gap-1">
              {dayGrid.map((dayNumber, index) =>
                dayNumber === null ? (
                  // Case de remplissage avant le 1er du mois. aria-hidden :
                  // elle n'a aucun sens à l'oral, seulement à l'œil.
                  <span
                    key={`pad-${index}`}
                    aria-hidden="true"
                    className="min-h-14 xl:min-h-10"
                  />
                ) : (
                  <CalendarCell
                    key={dayNumber}
                    label={String(dayNumber)}
                    title={`${dayNumber}/${String(month).padStart(2, "0")}/${year}`}
                    stats={dayStats.get(dayNumber)}
                    isSelected={day === dayNumber}
                    onClick={() => onToggleDay(dayNumber)}
                  />
                ),
              )}
            </div>
          )}

          <p className="pt-1 text-xs leading-snug text-foreground/45">
            Les jours sans service sont grisés. Touchez à nouveau une case
            sélectionnée pour revenir au mois entier.
          </p>
        </div>
      )}
    </section>
  );
}
