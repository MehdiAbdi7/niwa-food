import type { MenuExtra } from "@/types/menuItem";

/**
 * Nom du type d'un extra.
 *
 * Ne sert plus qu'au REPLI de resolveExtraGroups (produits non migrés) et à
 * l'affichage du catalogue dans MenuExtrasTab. Le libellé qui compte pour la
 * commande vient désormais du groupe porté par le produit — voir
 * lib/extraGroups.ts.
 */
export function getExtraTypeName(extra: MenuExtra): string {
  return typeof extra.type === "object" ? extra.type.name : "Suppléments";
}

// resolveExtraPrice() et isExtraSelectable() ont été retirés : la tarification
// dépend maintenant du produit qui propose l'extra, pas de l'extra seul.
// Utiliser resolveOptionPrice() de lib/extraGroups.ts.
