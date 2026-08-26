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
  totalPrice: number;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
