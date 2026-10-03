"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { STORES, type Store } from "@/types/store";

export interface OrderContext {
  /** Magasin déduit du QR, ou null si le client est arrivé par le site. */
  store: Store | null;
  /** Table déduite du QR. Non vérifiée en base ici — voir plus bas. */
  tableId: string | null;
  /** Vrai quand le QR portait les deux : le client est assis, en salle. */
  isSeated: boolean;
}

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

/**
 * Lit le contexte de commande depuis l'URL du QR code.
 *
 * `/commande`                              -> aucun contexte, le client choisit
 * `/commande?store=kouba&table=<objectId>`  -> client assis, tout est connu
 *
 * Les deux valeurs viennent de l'URL, donc de l'extérieur : elles sont
 * validées en forme ici, et rejetées silencieusement si elles ne tiennent pas.
 * Un paramètre bricolé à la main ne doit pas casser la page, juste ramener au
 * parcours manuel.
 *
 * L'existence réelle de la table n'est PAS vérifiée ici — ça demande un appel
 * à GET /tables/public?store=, fait par le composant qui affiche le contexte.
 * Et de toute façon, le backend revalide à la création de la commande : c'est
 * lui qui fait foi, pas ce hook.
 */
export function useOrderContext(): OrderContext {
  const searchParams = useSearchParams();

  const rawStore = searchParams.get("store");
  const rawTable = searchParams.get("table");

  return useMemo(() => {
    const store = STORES.includes(rawStore as Store)
      ? (rawStore as Store)
      : null;

    const tableId =
      rawTable && OBJECT_ID_PATTERN.test(rawTable) ? rawTable : null;

    return {
      store,
      tableId,
      // Une table sans magasin n'a pas de sens : le numéro de table seul est
      // ambigu entre Kouba et Chéraga.
      isSeated: store !== null && tableId !== null,
    };
  }, [rawStore, rawTable]);
}
