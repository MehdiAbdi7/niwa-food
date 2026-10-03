import type { OrderType } from "./order";

/**
 * Miroir de IPromoCode côté backend.
 *
 * PORTÉE GLOBALE : un code vaut pour Kouba comme pour Chéraga, il n'y a donc
 * pas de champ `store`. Et remise en POURCENTAGE uniquement — une seule
 * mécanique, donc un seul calcul, donc un seul endroit où un total peut être
 * faux.
 */
export interface PromoCode {
  _id: string;
  code: string;
  description?: string;
  discountPercent: number;

  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  maxUses?: number | null;
  orderTypes: OrderType[];

  usedCount: number;
  active: boolean;

  createdAt: string;
  updatedAt: string;
}

/**
 * Ce que renvoie GET /promo-codes/validate.
 *
 * Volontairement PAUVRE : ni compteur d'usages, ni dates, ni minimum de panier.
 * Cette route est publique — n'exposer que ce qui sert à afficher une ligne de
 * remise. Le détail des contraintes ne remonte que dans le message d'erreur,
 * et seulement quand il est actionnable.
 */
export interface PromoValidation {
  code: string;
  discountPercent: number;
  maxDiscountAmount: number | null;
  /**
   * APERÇU calculé pour le panier envoyé. Le montant qui fera foi est celui
   * que le backend recalcule à la création de la commande, à partir des prix
   * résolus en base.
   */
  discountAmount: number;
}

export interface CreatePromoCodePayload {
  code: string;
  description?: string;
  discountPercent: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  maxUses?: number | null;
  orderTypes?: OrderType[];
  active?: boolean;
}

export type UpdatePromoCodePayload = Partial<CreatePromoCodePayload>;

/** Forme canonique d'un code. Miroir de normalizePromoCode côté backend. */
export function normalizePromoCode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}
