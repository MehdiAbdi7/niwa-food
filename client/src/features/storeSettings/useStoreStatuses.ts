"use client";

import { useMemo } from "react";
import { useGetStoreStatusesQuery } from "./storeStatusApi";
import { DEFAULT_CLOSED_MESSAGE } from "./closedMessage";
import type { Store } from "@/types/store";
import type { StoreStatus } from "@/types/storeStatus";

// Un client peut rester longtemps sur la carte à composer sa commande : sans
// rafraîchissement, il découvrirait la fermeture au moment d'envoyer.
// Une minute suffit — ce n'est pas une donnée qui change au coup de minute.
const POLL_INTERVAL_MS = 60_000;

interface UseStoreStatusesResult {
  statuses: StoreStatus[];
  byStore: Partial<Record<Store, StoreStatus>>;
  closed: StoreStatus[];
  /** Vrai uniquement quand AUCUN magasin ne prend de commande. */
  allClosed: boolean;
  isLoading: boolean;
  isAccepting: (store: Store | null | undefined) => boolean;
  getClosedMessage: (store: Store | null | undefined) => string;
}

/**
 * État d'ouverture des magasins, prêt à consommer.
 *
 * `isAccepting` répond `true` par défaut — tant que la donnée n'est pas
 * arrivée, ou si l'appel échoue, on considère le magasin ouvert. Le pari est
 * assumé : bloquer la commande sur un simple échec réseau coûterait des ventes
 * réelles, alors qu'un client qui passe commande sur un magasin fermé se
 * heurtera de toute façon au 503 du backend, qui reste seul juge.
 */
export function useStoreStatuses(): UseStoreStatusesResult {
  const { data, isLoading } = useGetStoreStatusesQuery(undefined, {
    pollingInterval: POLL_INTERVAL_MS,
  });

  const statuses = useMemo(() => data ?? [], [data]);

  const byStore = useMemo(() => {
    const map: Partial<Record<Store, StoreStatus>> = {};
    for (const status of statuses) map[status.store] = status;
    return map;
  }, [statuses]);

  const closed = useMemo(
    () => statuses.filter((status) => !status.acceptingOrders),
    [statuses],
  );

  return {
    statuses,
    byStore,
    closed,
    // statuses.length > 0 obligatoire : sans ce garde, un tableau vide (donnée
    // pas encore chargée) rendrait `every` vrai et afficherait « tout est
    // fermé » pendant une fraction de seconde à chaque chargement.
    allClosed: statuses.length > 0 && closed.length === statuses.length,
    isLoading,
    isAccepting: (store) =>
      store ? (byStore[store]?.acceptingOrders ?? true) : true,
    getClosedMessage: (store) =>
      (store ? byStore[store]?.closedMessage : null) ?? DEFAULT_CLOSED_MESSAGE,
  };
}
