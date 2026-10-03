import { Types } from "mongoose";
import { Store } from "../../config/stores.js";

export interface IOrderItemExtra {
  extraId: Types.ObjectId;
  name: string;
  price: number;
}

// Snapshot de la formule au moment de la commande — les choix du client sont
// déjà résolus dans `includes`, la cuisine n'a pas à savoir ce qui était
// imposé et ce qui était optionnel.
export interface IOrderFormula {
  formulaId: string;
  name: string;
  price: number;
  pricingMode: "fixed" | "supplement";
  includes: string[]; // ex: ["Frites", "Jus Rouiba"]
}

export interface IOrderItem {
  menuItemId: Types.ObjectId;
  name: string;
  variantSelected: Record<string, string>;
  // Prix unitaire final, formule déjà appliquée (extras exclus)
  unitPrice: number;
  selectedExtras: IOrderItemExtra[];
  excludedIngredients: string[];
  quantity: number;
  formula?: IOrderFormula;
}

/**
 * INSTANTANÉ du code promo au moment de la commande.
 *
 * Même principe que le snapshot de formule et que les prix d'articles : la
 * commande fige ce qui a été RÉELLEMENT accordé, elle ne référence pas le code
 * vivant. Sans ça, passer NIWA10 de 10 % à 15 % en novembre modifierait le
 * chiffre d'affaires d'octobre — l'historique n'est qu'une agrégation sur
 * `orders`, il n'a aucun autre garde-fou.
 *
 * `promoCodeId` est conservé pour les statistiques (« combien de commandes ce
 * code a-t-il générées »), JAMAIS pour recalculer un montant. Le code peut
 * d'ailleurs avoir été supprimé depuis : le populate échouerait, le snapshot
 * non.
 */
export interface IOrderPromo {
  promoCodeId: Types.ObjectId;
  /** Le code tel qu'il était, en majuscules. */
  code: string;
  discountPercent: number;
  /** Plafond en vigueur ce jour-là. Absent = aucun. */
  maxDiscountAmount?: number;
}

export interface IOrderClient {
  fullName: string;
  phone?: string;
  address?: string;
}

export interface IOrder {
  type: "dine_in" | "takeaway" | "delivery";
  status: "pending" | "ready" | "out_for_delivery" | "completed" | "cancelled";
  store: Store;
  dailyNumber: number;
  /**
   * Journée commerciale d'appartenance, normalisée à minuit UTC.
   *
   * Dérivée de l'heure d'OUVERTURE du service, pas de `createdAt` ni de
   * `completedAt` : une commande encaissée à 00h20 appartient au service de la
   * veille (voir utils/serviceDate.ts). C'est l'unique axe temporel de
   * l'historique — ne jamais y substituer `completedAt`, sous peine de
   * réintroduire le décalage de fin de service.
   */
  serviceDate: Date;
  table?: Types.ObjectId;
  /**
   * Livreur en charge de la course (ref: User, role "delivery").
   *
   * VOLONTAIREMENT OPTIONNEL. Le rendre obligatoire au passage en livraison
   * bloquerait le service un soir où aucun livreur n'est enregistré, ou quand
   * le patron livre lui-même — dans ces cas-là, le staff valide la course
   * depuis le dashboard comme avant.
   *
   * C'est ce champ, et lui seul, qui détermine ce qu'un livreur voit :
   * GET /orders/my-deliveries filtre dessus.
   */
  deliveryPerson?: Types.ObjectId;
  client: IOrderClient;
  items: IOrderItem[];
  remark?: string;
  deliveryFee?: number;
  /** Code promo appliqué, figé. Absent = commande au tarif plein. */
  appliedPromo?: IOrderPromo;
  /**
   * Montant de la remise en DA, RECALCULÉ à chaque save().
   *
   * Ce n'est pas une valeur saisie : elle est dérivée de `appliedPromo` et du
   * total des articles, dans le pre("save") du modèle. C'est indispensable —
   * le staff peut ajouter des articles après coup (addItemsToOrder) ou fusionner
   * une commande de table, et une remise figée en dinars transformerait alors
   * un « -10 % » en un « -250 DA » sur un panier devenu bien plus gros.
   */
  discountAmount: number;
  /** Articles − remise + livraison. Toujours calculé, jamais reçu du client. */
  totalPrice: number;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
