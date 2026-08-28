import type { IOrderItem } from "../types/models/order.js";

/**
 * Calculs de totaux, SANS accès à la base.
 *
 * Fichier séparé de utils/promo.ts, qui lui interroge la collection PromoCode :
 * models/order.ts a besoin de ces deux fonctions dans son pre("save"), et lui
 * faire importer un module qui touche à un autre modèle créerait un couplage
 * dont on se passe très bien.
 */

/** Somme des articles, extras compris. Ni remise, ni frais de livraison. */
export function sumItemsTotal(
  items: Pick<IOrderItem, "unitPrice" | "selectedExtras" | "quantity">[],
): number {
  return items.reduce((sum, item) => {
    const extrasTotal = (item.selectedExtras ?? []).reduce(
      (extraSum, extra) => extraSum + extra.price,
      0,
    );
    return sum + (item.unitPrice + extrasTotal) * item.quantity;
  }, 0);
}

/**
 * Montant de la remise, en DA.
 *
 * PORTE SUR LES ARTICLES SEULEMENT, jamais sur les frais de livraison : ceux-ci
 * sont ce que le restaurant doit au livreur, les rogner d'une promotion revient
 * à faire payer l'opération commerciale par quelqu'un qui n'y est pour rien.
 *
 * Arrondi à l'entier : il n'existe pas de centime de dinar en caisse, et un
 * total à 1 247,4 DA n'est encaissable nulle part.
 *
 * Deux plafonds, dans cet ordre :
 *   - celui du code (maxDiscountAmount), s'il est défini
 *   - le total des articles, toujours : une remise ne rend pas de monnaie
 */
export function computeDiscountAmount(
  itemsTotal: number,
  discountPercent: number,
  maxDiscountAmount?: number | null,
): number {
  if (itemsTotal <= 0 || discountPercent <= 0) return 0;

  let discount = Math.round((itemsTotal * discountPercent) / 100);

  if (maxDiscountAmount !== undefined && maxDiscountAmount !== null) {
    discount = Math.min(discount, maxDiscountAmount);
  }

  return Math.max(0, Math.min(discount, itemsTotal));
}
