export interface MenuCategory {
  _id: string;
  name: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemVariant {
  combination: Record<string, string>;
  price: number;
}

export type ExtraPriceType = "fixed" | "bySize";

export interface MenuExtraType {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuExtra {
  _id: string;
  name: string;
  type: MenuExtraType | string;
  priceType: ExtraPriceType;
  price?: number;
  pricesBySize?: { M: number; L: number };
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Un extra tel que CE produit le propose.
 *
 * Les champs de prix sont facultatifs : absents, la tarification du MenuExtra
 * s'applique. Présents, ils l'écrasent — c'est ce qui permet à un seul
 * « Gouda » en base d'être facturé au forfait sur une pizza et par taille en
 * gratinage sur un tacos, au lieu d'exiger deux documents homonymes.
 */
export interface MenuItemExtraOption {
  extra: MenuExtra | string; // populate() renvoie l'objet, sinon juste l'id
  priceType?: ExtraPriceType;
  price?: number;
  pricesBySize?: { M: number; L: number };
}

/**
 * Regroupement présentationnel ET règle de saisie, portés par le produit.
 *
 * Le libellé vivait auparavant sur MenuExtraType, donc sur l'ingrédient : un
 * même Gouda ne pouvait pas être « Gratinage » ici et « Supplément » là. Et
 * la liste des types à choix unique était une constante globale du front,
 * d'où un « Gratinage » qui s'affichait jusque sur les pizzas.
 */
export interface MenuItemExtraGroup {
  label: string;
  singleChoice: boolean;
  options: MenuItemExtraOption[];
}

export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  category: MenuCategory | string; // populate() renvoie l'objet, sinon juste l'id
  variants: MenuItemVariant[];
  extraGroups: MenuItemExtraGroup[];
  /**
   * @deprecated Remplacé par extraGroups. Conservé le temps que tous les
   * produits soient migrés : lib/extraGroups.ts s'en sert comme repli.
   */
  availableExtras: MenuExtra[] | string[];
  removableIngredients: string[];
  imageUrl?: string;
  imagePublicId?: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuCategoryPayload {
  name: string;
  isActive?: boolean;
}

export interface CreateMenuItemExtraOptionPayload {
  extra: string;
  priceType?: ExtraPriceType;
  price?: number;
  pricesBySize?: { M: number; L: number };
}

export interface CreateMenuItemExtraGroupPayload {
  label: string;
  singleChoice: boolean;
  options: CreateMenuItemExtraOptionPayload[];
}

export interface CreateMenuItemPayload {
  name: string;
  description?: string;
  category: string;
  variants: MenuItemVariant[];
  extraGroups?: CreateMenuItemExtraGroupPayload[];
  availableExtras?: string[]; // déprécié
  removableIngredients?: string[];
  imageUrl?: string;
  available?: boolean;
}

export interface CreateMenuExtraPayload {
  name: string;
  type: string;
  priceType: ExtraPriceType;
  price?: number;
  pricesBySize?: { M: number; L: number };
  available?: boolean;
}
