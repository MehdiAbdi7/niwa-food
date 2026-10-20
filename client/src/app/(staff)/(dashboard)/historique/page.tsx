"use client";

import { useState } from "react";
import { HistoryToolbar } from "@/components/history/HistoryToolbar";
import { HistoryCalendar } from "@/components/history/HistoryCalendar";
import { HistoryOrderList } from "@/components/history/HistoryOrderList";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  useGetHistoryQuery,
  useGetHistoryYearsQuery,
  useGetHistoryMonthsQuery,
  useGetHistoryDaysQuery,
} from "@/features/history/historyApi";
import { useHistorySelection } from "@/features/history/useHistorySelection";
import { useDebouncedValue } from "@/features/history/useDebouncedValue";
import { useActiveStore } from "@/features/store/useActiveStore";
import { exportHistoryToCsv } from "@/lib/exportCsv";
import { formatSelectionLabel, formatServiceDayKey } from "@/lib/calendar";
import { PageHeader } from "@/components/dashboard/PageHeader";

// Fixé côté front ET plafonné côté backend (max 100). En dur plutôt qu'en
// réglage : personne n'a jamais demandé à changer ce nombre, et une option de
// plus, c'est une décision de plus à prendre pour l'utilisateur.
const PAGE_SIZE = 20;

/**
 * Historique des ventes.
 *
 * Le calendrier n'est PAS un chemin de navigation mais un FILTRE : il reste
 * affiché en permanence, et cliquer une case resserre la liste au lieu de
 * changer d'écran. C'est ce qui permet de comparer deux jours en deux clics,
 * là où l'ancien drill-down imposait de remonter puis redescendre.
 *
 * DISPOSITION : sur grand écran, le calendrier passe en colonne COLLANTE à
 * droite et la liste occupe la gauche. Empilé, il fallait faire défiler toute
 * la grille des jours avant d'apercevoir la première commande — or c'est la
 * liste qu'on vient lire, le calendrier n'est qu'un outil de cadrage.
 *
 * La bascule est à `xl` et non `lg` : à 1024px, une fois la sidebar de 256px
 * retirée, il reste ~700px. En prélever 320 pour le calendrier laisserait une
 * liste de 380px, où les colonnes montant/date ne tiennent plus.
 *
 * `flex-row-reverse` plutôt qu'un réordonnancement du JSX : le calendrier
 * reste PREMIER dans le DOM, donc au-dessus de la liste sur mobile — c'est là
 * qu'il sert de point d'entrée — tout en s'affichant à droite sur desktop.
 *
 * Tout le travail lourd — plage de dates, recherche, tri, découpage en pages,
 * totaux — est fait par MongoDB (voir order.controller.ts::getHistory). Le
 * navigateur ne reçoit jamais plus de 20 lignes projetées, quelle que soit la
 * taille de l'historique.
 */
export default function HistoriquePage() {
  const { activeStore, isAllStores } = useActiveStore();
  const {
    selection,
    apiType,
    sortBy,
    sortOrder,
    setType,
    setYear,
    toggleMonth,
    toggleDay,
    setSearch,
    setSort,
    setPage,
    clearSelection,
  } = useHistorySelection();

  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  // Ne part au serveur qu'une fois la frappe stabilisée — le champ, lui, reste
  // piloté par la valeur brute (voir HistoryToolbar).
  const debouncedSearch = useDebouncedValue(selection.search);

  // `apiType` vaut undefined en vue « Tous » : la clé est alors retirée de
  // l'URL par pruneParams, et le backend la traduit en $in sur tous les types.
  const baseParams = { type: apiType, store: activeStore };

  const yearsQuery = useGetHistoryYearsQuery(baseParams);

  /**
   * Année effective : celle choisie explicitement, sinon la plus récente.
   *
   * DÉRIVÉE, jamais posée par un effet. Un `useEffect` qui appellerait
   * `setYear` au chargement provoquerait un rendu de plus, un appel réseau
   * jeté, et un clignotement à chaque changement de type de commande.
   * L'agrégation trie déjà les années du plus récent au plus ancien.
   */
  const year = selection.year ?? yearsQuery.data?.[0]?.year ?? null;

  const monthsQuery = useGetHistoryMonthsQuery(
    { ...baseParams, year: year ?? 0 },
    { skip: year === null },
  );

  // Le premier mois disponible est le mois actif par défaut : la grille des
  // jours reste donc visible dès l'ouverture, sans imposer un clic préalable.
  const activeMonth = selection.month ?? monthsQuery.data?.[0]?.month ?? null;

  // Les jours sont chargés pour le mois actif, même quand il s'agit du mois
  // proposé automatiquement par l'API.
  const daysQuery = useGetHistoryDaysQuery(
    { ...baseParams, year: year ?? 0, month: activeMonth ?? 0 },
    { skip: year === null || activeMonth === null },
  );

  const historyQuery = useGetHistoryQuery(
    {
      ...baseParams,
      year: year ?? 0,
      // `undefined` et non `null` : historyApi retire les clés indéfinies de
      // l'URL, ce qui laisse le backend déduire le bon niveau de précision.
      month: activeMonth ?? undefined,
      day: selection.day ?? undefined,
      search: debouncedSearch.trim() || undefined,
      sortBy,
      sortOrder,
      page: selection.page,
      limit: PAGE_SIZE,
    },
    { skip: year === null },
  );

  const selectionLabel = formatSelectionLabel(year, activeMonth, selection.day);

  function handleExport() {
    const orders = historyQuery.data?.orders;
    if (!orders?.length || year === null) return;

    const period = formatServiceDayKey(year, selection.month, selection.day);
    // selection.type et non apiType : « all » doit apparaître dans le nom du
    // fichier, sinon deux exports de périmètres différents portent le même nom.
    exportHistoryToCsv(
      orders,
      `niwa-${selection.type}-${period}-p${selection.page}.csv`,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Analyse"
        title="Historique"
        description="Retrouve, filtre et exporte les ventes passées de tes établissements."
      />

      {/* Les filtres transverses restent pleine largeur, AU-DESSUS des deux
          colonnes : ils s'appliquent aussi bien au calendrier qu'à la liste. */}
      <HistoryToolbar
        type={selection.type}
        search={selection.search}
        sort={selection.sort}
        onTypeChange={setType}
        onSearchChange={setSearch}
        onSortChange={setSort}
      />

      <div className="flex flex-col gap-6 xl:flex-row-reverse xl:items-start xl:gap-5">
        {/* ---------- Calendrier ----------
            Collant sous la topbar (sticky top-16 + une respiration) : il reste
            à portée de clic pendant qu'on parcourt la liste, au lieu de
            disparaître dès la deuxième page.
            max-h + overflow : garde-fou pour un écran bas en paysage, où la
            grille des jours dépasserait la fenêtre. */}
        <aside className="xl:sticky xl:top-20 xl:max-h-[calc(100vh-6.5rem)] xl:w-80 xl:shrink-0 xl:overflow-y-auto">
          <HistoryCalendar
            years={yearsQuery.data ?? []}
            months={monthsQuery.data ?? []}
            days={daysQuery.data ?? []}
            year={year}
            month={activeMonth}
            day={selection.day}
            isLoadingYears={yearsQuery.isLoading}
            isLoadingMonths={monthsQuery.isLoading}
            isLoadingDays={daysQuery.isLoading}
            onSelectYear={setYear}
            onToggleMonth={toggleMonth}
            onToggleDay={toggleDay}
          />
        </aside>

        {/* ---------- Liste ----------
            min-w-0 obligatoire : sans lui, le min-width:auto d'un flex item
            empêche le tableau de se comprimer, et la colonne déborde sous le
            calendrier au lieu de tronquer ses cellules. */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {year !== null ? (
            <HistoryOrderList
              orders={historyQuery.data?.orders ?? []}
              summary={historyQuery.data?.summary}
              selectionLabel={selectionLabel}
              currentPage={historyQuery.data?.currentPage ?? selection.page}
              totalPages={historyQuery.data?.totalPages ?? 1}
              isLoading={historyQuery.isLoading}
              isFetching={historyQuery.isFetching}
              isError={historyQuery.isError}
              hasSearch={debouncedSearch.trim().length > 0}
              isSingleDay={selection.day !== null}
              // La colonne magasin n'a de sens que dans la vue « tous les
              // magasins » d'un admin : ailleurs, elle répéterait la même
              // valeur sur chaque ligne.
              showStore={isAllStores}
              // La colonne type ne s'affiche qu'en vue « Tous » : ailleurs elle
              // répéterait la même valeur sur chaque ligne.
              showType={selection.type === "all"}
              onPageChange={setPage}
              onOpenOrder={setOpenOrderId}
              onExport={handleExport}
              onClearFilters={clearSelection}
            />
          ) : (
            // Aucune année disponible. Le calendrier affiche déjà son propre
            // état vide, mais en disposition deux colonnes le laisser seul
            // creuserait 700px de blanc à sa gauche — le doublon coûte moins
            // cher qu'une page qui paraît cassée.
            <EmptyState
              icon="icon-[mdi--calendar-search]"
              title="Aucune vente à afficher"
              description="Les commandes encaissées apparaîtront ici, service après service."
            />
          )}
        </div>
      </div>

      <OrderDetailModal
        orderId={openOrderId}
        onClose={() => setOpenOrderId(null)}
      />
    </div>
  );
}
