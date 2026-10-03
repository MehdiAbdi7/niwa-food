import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { writeStoredCart } from "@/lib/cartStorage";
import {
  cartCleared,
  cartReconciled,
  lineAdded,
  lineQuantityChanged,
  lineRemoved,
  lineReplaced,
} from "./cartSlice";
import type { RootState } from "@/lib/store";

/**
 * Sauvegarde le panier après chaque mutation.
 *
 * createListenerMiddleware plutôt qu'un middleware maison : les actions
 * surveillées sont déclarées explicitement, donc en ajouter une plus tard se
 * voit ici et nulle part ailleurs. L'effet s'exécute APRÈS le reducer, on lit
 * donc bien l'état d'arrivée.
 *
 * Aucun debounce : ces actions viennent toutes d'un clic, jamais d'une frappe.
 */
export const cartListener = createListenerMiddleware();

cartListener.startListening({
  matcher: isAnyOf(
    lineAdded,
    lineReplaced,
    lineRemoved,
    lineQuantityChanged,
    cartCleared,
    // Indispensable : sans ça, un article retiré à la réconciliation
    // réapparaîtrait au rafraîchissement suivant, toujours présent sur disque.
    cartReconciled,
  ),
  effect: (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;

    // Avant l'hydratation, l'état en mémoire ne fait pas foi : écrire ici
    // écraserait le panier stocké par un tableau vide.
    if (!state.publicCart.isHydrated) return;

    writeStoredCart(state.publicCart.lines);
  },
});
