"use client";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pagination } from "./Pagination";
import { formatDA, formatServiceDate, formatTime } from "@/lib/format";
import { ORDER_TYPE_LABELS } from "@/lib/orderLabels";
import { STORE_LABELS } from "@/types/store";
import type { HistoryListItem, HistorySummary } from "@/features/history/historyApi";

interface HistoryOrderListProps {
  orders: HistoryListItem[];
  summary: HistorySummary | undefined;
  selectionLabel: string;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  /** Vrai pendant un refetch, données précédentes encore à l'écran. */
  isFetching: boolean;
  isError: boolean;
  hasSearch: boolean;
  /** Vrai quand un jour précis est sélectionné : l'heure suffit alors. */
  isSingleDay: boolean;
  showStore: boolean;
  /** Vrai en vue « Tous » : sans ça, impossible de distinguer les lignes. */
  showType: boolean;
  onPageChange: (page: number) => void;
  onOpenOrder: (id: string) => void;
  onExport: () => void;
  onClearFilters: () => void;
}

function OrderRow({
  order,
  isSingleDay,
  showStore,
  showType,
  onOpen,
}: {
  order: HistoryListItem;
  isSingleDay: boolean;
  showStore: boolean;
  showType: boolean;
  onOpen: () => void;
}) {
  // Sur une sélection d'un seul jour, réafficher la date sur chaque ligne est
  // redondant : l'en-tête la donne déjà. Sur un mois ou une année, en
  // revanche, c'est l'information qui situe la commande.
  const dateLabel = isSingleDay
    ? order.completedAt
      ? formatTime(order.completedAt)
      : ""
    : formatServiceDate(order.serviceDate);

  // Assemblé par filtrage plutôt qu'en concaténant des chaînes conditionnelles :
  // ça évite les « · » orphelins en début ou en fin de ligne quand une des
  // trois informations est masquée.
  const metaLine = [
    dateLabel,
    showType ? ORDER_TYPE_LABELS[order.type] : null,
    showStore ? STORE_LABELS[order.store] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-border-subtle bg-surface px-3 py-3 text-left transition-colors hover:border-primary sm:px-4"
    >
      {/* Numéro — largeur fixe pour que les noms s'alignent d'une ligne à
          l'autre, quel que soit le nombre de chiffres. */}
      <span className="tabular-nums w-12 shrink-0 font-heading text-lg font-bold text-foreground">
        #{order.dailyNumber}
      </span>

      {/* min-w-0 : sans lui, un nom long pousse le montant hors de l'écran —
          un flex item ne se comprime pas en dessous de son contenu par défaut. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-foreground">
          {order.client.fullName}
        </span>
        <span className="tabular-nums truncate text-xs text-foreground/45">
          {metaLine}
        </span>
      </div>

      {/* Le badge de statut disparaît sous sm : l'historique ne contient que
          des commandes terminées, c'est donc l'information la moins utile de
          la ligne, la première à sacrifier quand la place manque. */}
      <span className="hidden shrink-0 sm:block">
        <StatusBadge status={order.status} />
      </span>

      <span className="tabular-nums shrink-0 font-heading text-sm font-bold text-accent-green sm:text-base">
        {formatDA(order.totalPrice)}
      </span>
    </button>
  );
}

export function HistoryOrderList({
  orders,
  summary,
  selectionLabel,
  currentPage,
  totalPages,
  isLoading,
  isFetching,
  isError,
  hasSearch,
  isSingleDay,
  showStore,
  showType,
  onPageChange,
  onOpenOrder,
  onExport,
  onClearFilters,
}: HistoryOrderListProps) {
  if (isError) {
    return (
      <EmptyState
        icon="icon-[mdi--cloud-off-outline]"
        title="Impossible de charger l'historique"
        description="Vérifie ta connexion, puis recharge la page."
      />
    );
  }

  return (
    <section className="flex flex-col gap-3">
      {/* ---------- Récapitulatif ----------
          Les chiffres portent sur TOUTE la sélection, pas sur la page
          affichée : « 312 commandes » resterait faux s'il ne comptait que les
          20 lignes visibles. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-heading text-sm font-bold text-foreground">
            {selectionLabel}
          </span>
          {isLoading || !summary ? (
            <Skeleton className="mt-1 h-4 w-40" />
          ) : (
            <span className="tabular-nums text-xs text-foreground/75">
              {summary.count} commande{summary.count > 1 ? "s" : ""} ·{" "}
              <span className="font-semibold text-accent-green">
                {formatDA(summary.revenue)}
              </span>
              {summary.count > 0 &&
                ` · panier moyen ${formatDA(summary.averageBasket)}`}
            </span>
          )}
        </div>

        {orders.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            icon="icon-[mdi--download-outline]"
            onClick={onExport}
          >
            Exporter cette page
          </Button>
        )}
      </div>

      {/* ---------- Lignes ----------
          isLoading (premier chargement) => squelette. isFetching (changement
          de page ou de filtre) => on GARDE les lignes précédentes en les
          atténuant : remplacer la liste par un squelette à chaque frappe fait
          clignoter tout l'écran et fait perdre le fil. */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={
            hasSearch
              ? "icon-[mdi--magnify-close]"
              : "icon-[mdi--receipt-text-outline]"
          }
          title={hasSearch ? "Aucun résultat" : "Aucune commande sur cette période"}
          description={
            hasSearch
              ? "Essaie un autre numéro ou un autre nom, ou élargis la période."
              : "Choisis une autre case du calendrier."
          }
          action={
            <Button
              variant="secondary"
              size="sm"
              icon="icon-[mdi--filter-remove-outline]"
              onClick={onClearFilters}
            >
              Réinitialiser les filtres
            </Button>
          }
        />
      ) : (
        <div
          className={`flex flex-col gap-2 transition-opacity ${
            isFetching ? "opacity-50" : ""
          }`}
          // aria-busy : le lecteur d'écran sait que ce qui est lu est en cours
          // de remplacement, plutôt que d'annoncer des données périmées.
          aria-busy={isFetching}
        >
          {orders.map((order) => (
            <OrderRow
              key={order._id}
              order={order}
              isSingleDay={isSingleDay}
              showStore={showStore}
              showType={showType}
              onOpen={() => onOpenOrder(order._id)}
            />
          ))}
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          isBusy={isFetching}
        />
      )}
    </section>
  );
}
