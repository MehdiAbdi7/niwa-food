"use client";

import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SkeletonGrid, Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useGetServiceStatsQuery } from "@/features/orders/orderApi";
import { useActiveStore } from "@/features/store/useActiveStore";
import { useAuth } from "@/features/auth/useAuth";
import { formatDA, formatTime } from "@/lib/format";
import { ORDER_TYPE_LABELS } from "@/lib/orderLabels";
import { STORE_LABELS } from "@/types/store";
import type { ServiceStats, OrderStatus } from "@/types/order";

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
];

function StoreServicePanel({ stats }: { stats: ServiceStats }) {
  return (
    <section className="surface-card flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-green/15 text-accent-green">
            <span className="icon-[mdi--store-outline] text-xl" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">
              {STORE_LABELS[stats.store]}
            </h2>
            <p className="flex items-center gap-1.5 text-xs text-foreground/75">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
              {stats.serviceStartedAt
                ? `Service depuis ${formatTime(stats.serviceStartedAt)}`
                : "Aucun service ouvert"}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-accent-green/10 px-3 py-1 text-xs font-bold text-accent-green">
          Service en cours
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon="icon-[mdi--cash-multiple]"
          label="CA du service"
          value={formatDA(stats.revenue)}
          accent="green"
        />
        <StatCard
          icon="icon-[mdi--receipt-text-outline]"
          label="Commandes"
          value={String(stats.orders)}
          accent="primary"
        />
        <StatCard
          icon="icon-[mdi--basket-outline]"
          label="Panier moyen"
          value={formatDA(stats.averageBasket)}
          accent="mustard"
        />
        <StatCard
          icon="icon-[mdi--check-all]"
          label="Terminées"
          value={String(stats.completed)}
          accent="green"
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border-subtle pb-5">
        {STATUS_ORDER.filter((status) => stats.byStatus[status]).map(
          (status) => (
            <div
              key={status}
              className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-2 py-1"
            >
              <StatusBadge status={status} />
              <span className="pr-1 text-xs font-bold text-foreground/70">
                {stats.byStatus[status]}
              </span>
            </div>
          ),
        )}
      </div>

      {(stats.byType.length > 0 || stats.topItems.length > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stats.byType.length > 0 && (
            <div className="rounded-2xl bg-surface-2/45 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-foreground/75">
                Répartition par type
              </p>
              <div className="flex flex-col gap-1.5">
                {stats.byType.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex items-center justify-between rounded-xl bg-surface px-3 py-2.5 text-sm"
                  >
                    <span className="text-foreground/80">
                      {ORDER_TYPE_LABELS[entry._id]}
                    </span>
                    <span className="font-semibold text-foreground">
                      {entry.count} · {formatDA(entry.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.topItems.length > 0 && (
            <div className="rounded-2xl bg-surface-2/45 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-foreground/75">
                Top produits
              </p>
              <div className="flex flex-col gap-1.5">
                {stats.topItems.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-xl bg-surface px-3 py-2.5 text-sm"
                  >
                    <span className="flex items-center gap-2 text-foreground/80">
                      <span className="text-xs font-bold text-primary">
                        #{index + 1}
                      </span>
                      {item.name}
                    </span>
                    <span className="font-semibold text-foreground">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function DashboardHomePage() {
  const { user } = useAuth();
  const { activeStore } = useActiveStore();
  const {
    data: stats,
    isLoading,
    isError,
  } = useGetServiceStatsQuery({ store: activeStore });

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-accent-green">
            Vue d&apos;ensemble
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Bonjour {user?.firstname}
          </h2>
          <p className="mt-1 text-sm text-foreground/75">
            Voici l&apos;activité de ton service en cours.
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-foreground/75">
          <span className="icon-[mdi--pulse] text-base text-accent-green" />
          Suivi en temps réel
        </div>
      </header>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <SkeletonGrid count={4} />
        </div>
      )}

      {isError && (
        <EmptyState
          icon="icon-[mdi--cloud-off-outline]"
          title="Impossible de charger les statistiques"
          description="Vérifie que le backend est bien démarré."
        />
      )}

      {!isLoading && !isError && stats && stats.length === 0 && (
        <EmptyState
          icon="icon-[mdi--store-outline]"
          title="Aucun magasin accessible"
        />
      )}

      {!isLoading &&
        !isError &&
        stats?.map((storeStats) => (
          <StoreServicePanel key={storeStats.store} stats={storeStats} />
        ))}
    </div>
  );
}
