import { OrderType } from "../../config/orderTypes.js";

/**
 * Code promotionnel, saisi par le client au moment de valider sa commande.
 *
 * PORTÉE GLOBALE, volontairement : un code vaut pour Kouba comme pour Chéraga.
 * Le jour où une promotion doit viser un seul restaurant, ajouter un champ
 * `stores: Store[]` ici et une clause dans resolvePromoCode — mais n'anticipe
 * pas : un champ jamais rempli finit toujours par être mal rempli.
 *
 * REMISE EN POURCENTAGE UNIQUEMENT. Un montant fixe imposerait une deuxième
 * règle de calcul dans le pre("save") du modèle Order, donc deux endroits où
 * un total peut diverger de ce qui a été annoncé au client.
 */
export interface IPromoCode {
  /**
   * Ce que le client tape. Normalisé en MAJUSCULES et sans espaces avant
   * l'enregistrement comme avant la recherche (voir utils/promo.ts) : personne
   * ne saisit " niwa10 " de la même façon deux fois.
   */
  code: string;

  /** Note interne ("Ouverture Chéraga", "Flyers novembre"). Jamais montrée au client. */
  description?: string;

  /** 1 à 100. C'est la seule mécanique de remise supportée. */
  discountPercent: number;

  /* ---------- Contraintes, toutes facultatives ---------- */

  /**
   * Plafond de la remise, en DA.
   *
   * LA contrainte à conseiller à l'admin : -10% sur une commande de groupe à
   * 12 000 DA, c'est 1 200 DA offerts sur une commande qu'on n'avait pas prévue.
   * Un plafond borne le risque sans changer le discours côté client.
   */
  maxDiscountAmount?: number;

  /** Panier minimum (articles seuls, hors livraison) pour que le code s'applique. */
  minOrderAmount?: number;

  /** Début de validité. Absent = valable immédiatement. */
  startsAt?: Date | null;

  /** Fin de validité. Absent = sans échéance. */
  endsAt?: Date | null;

  /**
   * Nombre TOTAL d'utilisations, tous clients confondus.
   *
   * Pas de limite « par personne » : sans compte client, elle ne tiendrait sur
   * rien de vérifiable — un numéro de téléphone se change en une frappe, et une
   * commande sur place n'en fournit même pas. Une contrainte qu'on ne peut pas
   * faire respecter est pire qu'une contrainte absente.
   */
  maxUses?: number | null;

  /**
   * Modes de service concernés. Vide = tous.
   *
   * Le cas d'usage réel : un code réservé à la livraison, pour pousser ce canal
   * sans rogner les ventes au comptoir qui marchent déjà.
   */
  orderTypes: OrderType[];

  /** Incrémenté atomiquement à chaque commande. Jamais saisi à la main. */
  usedCount: number;

  /** Interrupteur immédiat, indépendant des dates. */
  active: boolean;

  createdAt: Date;
  updatedAt: Date;
}
