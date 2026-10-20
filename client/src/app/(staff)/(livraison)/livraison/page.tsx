"use client";

import { DeliveryOrderCard } from "@/components/delivery/DeliveryOrderCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useGetMyDeliveriesQuery,
  DELIVERIES_POLL_INTERVAL_MS,
} from "@/features/delivery/deliveryApi";
import { formatDA } from "@/lib/format";

/**
 * Les courses en cours du livreur connecté.
 *
 * Un seul écran, sans filtre ni onglet : le backend ne lui renvoie que ses
 * commandes `out_for_delivery`, donc tout ce qui est affiché est à faire
 * maintenant. Une course validée disparaît, et l'écran vide devient le signal
 * que la tournée est finie — ce qui vaut mieux qu'un compteur à zéro perdu au
 * milieu d'une interface encore pleine.
 *
 * Le polling n'est qu'un filet : le socket (room delivery:<id>) rafraîchit
 * normalement en direct dès que le staff assigne ou annule une course.
 */
export default function LivraisonPage() {
  const { data: orders, isLoading, isError } = useGetMyDeliveriesQuery(
    undefined,
    { pollingInterval: DELIVERIES_POLL_INTERVAL_MS },
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon="icon-[mdi--cloud-off-outline]"
        title="Impossible de charger vos courses"
        description="Vérifiez votre connexion, la page se rafraîchit toute seule."
      />
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon="icon-[mdi--moped-outline]"
        title="Aucune course en cours"
        description="Les commandes qui vous seront confiées apparaîtront ici, sans avoir à rafraîchir."
      />
    );
  }

  // Somme des montants à rapporter : c'est ce que le livreur doit avoir en
  // poche en rentrant, et la seule statistique qui lui soit utile.
  const totalToCollect = orders.reduce(
    (sum, order) => sum + order.totalPrice,
    0,
  );

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent-green">
            En cours
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            {orders.length} course{orders.length > 1 ? "s" : ""}
          </h1>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs font-semibold text-foreground/75">
            Total à encaisser
          </span>
          <span className="tabular-nums font-heading text-xl font-bold text-accent-green">
            {formatDA(totalToCollect)}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <DeliveryOrderCard key={order._id} order={order} />
        ))}
      </div>

      <p className="pt-2 text-center text-xs text-foreground/40">
        Gardez cette page ouverte, elle se met à jour toute seule.
      </p>
    </div>
  );
}
