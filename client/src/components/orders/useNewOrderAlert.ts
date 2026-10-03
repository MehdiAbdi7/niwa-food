"use client";

import { useEffect, useRef } from "react";
import type { Order } from "@/types/order";
import { playNewOrderBeep } from "@/lib/orderAlertSound";

// Compare l'ensemble des IDs "pending" d'un rendu à l'autre : tout ID présent
// maintenant mais absent avant = nouvelle commande arrivée depuis le dernier
// rendu (peu importe si elle vient du socket ou d'un refetch classique).
export function useNewOrderAlert(pendingOrders: Order[]): void {
  const knownIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    const currentIds = new Set(pendingOrders.map((o) => o._id));

    // Premier rendu : on mémorise sans sonner, sinon toutes les commandes déjà
    // en attente au chargement de la page déclencheraient le bip d'un coup.
    if (knownIds.current === null) {
      knownIds.current = currentIds;
      return;
    }

    const hasNewOrder = pendingOrders.some((o) => !knownIds.current!.has(o._id));
    if (hasNewOrder) playNewOrderBeep();

    knownIds.current = currentIds;
  }, [pendingOrders]);
}
