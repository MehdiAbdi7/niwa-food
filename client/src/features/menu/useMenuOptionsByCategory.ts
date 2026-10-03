"use client";

import { useMemo } from "react";
import { useGetMenuItemsQuery } from "./menuApi";

/**
 * Noms des produits disponibles, groupés par nom de catégorie.
 *
 * Sert à alimenter les choix de formule (boisson d'un menu) depuis le menu réel
 * plutôt qu'une liste en dur. Aucune requête supplémentaire : RTK Query sert le
 * cache déjà rempli par MenuBrowser.
 *
 * Le NOM est la clé, pas l'_id : c'est ce que le backend attend dans
 * `formula.choices` et ce qu'il fige dans le snapshot de la commande.
 */
export function useMenuOptionsByCategory(): Record<string, string[]> {
  const { data: items } = useGetMenuItemsQuery();

  return useMemo(() => {
    const options: Record<string, string[]> = {};

    for (const item of items ?? []) {
      if (!item.available) continue;

      // getMenuItems fait populate("category") : le nom est déjà là. Le garde
      // reste utile, `category` pouvant être un simple id selon l'appel.
      const categoryName =
        typeof item.category === "object" ? item.category?.name : undefined;
      if (!categoryName) continue;

      (options[categoryName] ??= []).push(item.name);
    }

    for (const list of Object.values(options)) {
      list.sort((a, b) => a.localeCompare(b, "fr"));
    }

    return options;
  }, [items]);
}
