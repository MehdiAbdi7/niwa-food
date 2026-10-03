"use client";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { storeSelected } from "./storeScopeSlice";
import { useAuth } from "@/features/auth/useAuth";
import type { Store } from "@/types/store";

// Centralise la règle : un employee est TOUJOURS scoped sur son magasin
// (peu importe ce qu'il y a dans storeScopeSlice — c'est une sécurité
// d'affichage, la vraie restriction est faite côté backend). Un admin choisit
// librement, y compris "les deux" (undefined = pas de filtre store en query).
export function useActiveStore() {
  const dispatch = useAppDispatch();
  const { user, isAdmin } = useAuth();
  const selectedStore = useAppSelector((state) => state.storeScope.selectedStore);

  const activeStore: Store | undefined = isAdmin
    ? (selectedStore ?? undefined)
    : user?.store;

  function setActiveStore(store: Store | null) {
    if (!isAdmin) return; // no-op pour un employee, la valeur n'a pas de sens
    dispatch(storeSelected(store));
  }

  return {
    activeStore, // undefined = admin sans filtre -> "tous les magasins"
    isAllStores: isAdmin && selectedStore === null,
    canSwitchStore: isAdmin,
    setActiveStore,
  };
}
