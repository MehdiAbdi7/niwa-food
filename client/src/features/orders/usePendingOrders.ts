"use client";

import { useGetOrdersQuery } from "./orderApi";
import type { Order } from "@/types/order";

// Même cadence que la page Commandes : filet de sécurité si le socket décroche
// silencieusement. Le mécanisme principal reste l'invalidation du tag "Order"
// à chaque événement new_order / order_updated (voir realtimeConnection.ts).
const POLL_INTERVAL_MS = 20_000;

// Référence stable : un `?? []` créerait un nouveau tableau à chaque rendu.
const NO_ORDERS: Order[] = [];

/**
 * Commandes « Nouvelles » (statut pending) de tous les magasins visibles.
 *
 * Pas de `store` dans la requête, volontairement : le backend ramène un
 * employé à son magasin (resolveAccessibleStores), et un admin reçoit les
 * deux, quel que soit le magasin choisi dans le sélecteur. L'alerte ne doit
 * pas se taire parce que l'admin regarde l'autre restaurant.
 *
 * Partagé par NewOrderAlert, la Sidebar et la BottomNav : mêmes arguments,
 * donc RTK Query n'envoie qu'une seule requête pour les trois.
 */
export function usePendingOrders() {
  const { data, isSuccess } = useGetOrdersQuery(
    { status: "pending", limit: 200 },
    { pollingInterval: POLL_INTERVAL_MS },
  );

  return {
    pendingOrders: data?.orders ?? NO_ORDERS,
    // totalCount vient du backend : juste, même au-delà de la limite de 200.
    count: data?.totalCount ?? 0,
    isSuccess,
  };
}
