import { Types } from "mongoose";

export interface IMenuItemVariant {
  combination: Record<string, string>; // ex: { taille: "M", viande: "poulet" } ou {} si pas de variante
  price: number;
}

/**
 * Un extra tel que CE produit le propose.
 *
 * Les champs de prix sont facultatifs : absents, on retombe sur la
 * tarification du MenuExtra lui-même. Présents, ils l'écrasent — c'est ce qui
 * permet à un seul « Gouda » en base d'être facturé au forfait sur une pizza
 * et par taille en gratinage sur un tacos, au lieu d'exiger deux documents
 * portant le même nom.
 */
export interface IMenuItemExtraOption {
  extra: Types.ObjectId; // ref: MenuExtra
  priceType?: "fixed" | "bySize";
  price?: number;
  pricesBySize?: { M: number; L: number };
}

/**
 * Regroupement présentationnel ET règle de saisie, portés par le produit.
 *
 * Le label vivait auparavant sur MenuExtraType, donc sur l'ingrédient : un
 * même Gouda ne pouvait pas être « Gratinage » ici et « Supplément » là. Et
 * côté front, la liste des types à choix unique était une constante globale,
 * d'où un « Gratinage » qui s'affichait sur les pizzas.
 */
export interface IMenuItemExtraGroup {
  label: string; // ex: "Gratinage", "Suppléments", "Sauces"
  singleChoice: boolean; // un tacos ne reçoit qu'un seul gratinage
  options: IMenuItemExtraOption[];
}

export interface IMenuItem {
  name: string;
  description?: string;
  category: Types.ObjectId;
  variants: IMenuItemVariant[];
  extraGroups: IMenuItemExtraGroup[];
  /**
   * @deprecated Remplacé par extraGroups. Conservé le temps que tous les
   * produits soient migrés (voir scripts/migrateExtraGroups.ts) : pricing.ts
   * s'en sert encore comme repli pour un produit non migré. À supprimer une
   * fois la migration passée en production.
   */
  availableExtras: Types.ObjectId[];
  removableIngredients: string[];
  imageUrl?: string;
  imagePublicId?: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}
