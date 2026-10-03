import type { Store } from "./store";
import type { RestaurantTable } from "./table";

/**
 * Miroir de src/config/orderTypes.ts côté backend.
 *
 * Une LISTE et non seulement une union de types : les onglets de filtre ont
 * besoin d'itérer dessus, et une seconde liste recopiée dans un composant
 * finirait par oublier un mode de service.
 */
export const ORDER_TYPES = ["dine_in", "takeaway", "delivery"] as const;

export type OrderType = (typeof ORDER_TYPES)[number];
export type OrderStatus =
  | "pending"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export interface OrderItemExtra {
  extraId: string;
  name: string; // snapshot au moment de la commande
  price: number; // snapshot au moment de la commande
}

export interface OrderFormula {
  formulaId: string;
  name: string;
  price: number;
  pricingMode: "fixed" | "supplement";
  includes: string[];
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  variantSelected: Record<string, string>;
  unitPrice: number;
  selectedExtras: OrderItemExtra[];
  excludedIngredients: string[];
  quantity: number;
  formula?: OrderFormula;
}

export interface OrderClient {
  fullName: string;
  phone?: string;
  address?: string;
}

/**
 * INSTANTANÉ du code promo appliqué.
 *
 * Le code peut avoir été modifié ou supprimé depuis : c'est cette copie qui
 * fait foi, jamais le document PromoCode. Sur la route publique de suivi, seuls
 * `code` et `discountPercent` sont projetés (voir TRACKING_FIELDS), d'où les
 * champs optionnels.
 */
export interface OrderPromo {
  promoCodeId?: string;
  code: string;
  discountPercent: number;
  maxDiscountAmount?: number;
}

export interface Order {
  _id: string;
  type: OrderType;
  status: OrderStatus;
  store: Store;
  dailyNumber: number;
  /**
   * Journée commerciale d'appartenance (ISO, minuit UTC).
   *
   * Dérivée de l'heure d'OUVERTURE du service : une commande encaissée à 00h20
   * appartient au service de la veille. Toujours l'afficher avec
   * formatServiceDate() (timeZone UTC), jamais avec formatDateTime().
   */
  serviceDate: string;
  table?: RestaurantTable | string | null;
  /**
   * Livreur assigné, ou absent. Populé en objet par le dashboard, brut
   * (ObjectId) partout ailleurs — d'où l'union.
   */
  deliveryPerson?: OrderDeliveryPerson | string | null;
  client: OrderClient;
  items: OrderItem[];
  remark?: string;
  deliveryFee?: number;
  /** Code promo figé. Absent = commande au tarif plein. */
  appliedPromo?: OrderPromo;
  /**
   * Remise en DA, recalculée par le backend à chaque save().
   *
   * Optionnel côté type : les commandes antérieures à la fonctionnalité n'ont
   * pas ce champ. Toujours lire `order.discountAmount ?? 0`.
   */
  discountAmount?: number;
  /** Articles − remise + livraison. */
  totalPrice: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Livreur tel que populé par le backend sur getOrders / getOrderById.
 *
 * Projection volontairement courte (firstname lastname tel) : la fiche
 * commande n'a besoin que de savoir QUI porte la course et comment le joindre.
 */
export interface OrderDeliveryPerson {
  _id: string;
  firstname: string;
  lastname: string;
  tel?: string;
}

/**
 * Lit le livreur d'une commande, quel que soit l'état du populate.
 *
 * Renvoie null quand le champ est absent ou n'est qu'un identifiant : dans ce
 * dernier cas il n'y a rien d'affichable, et deviner un nom serait pire que ne
 * rien montrer.
 */
export function getDeliveryPerson(
  order: Pick<Order, "deliveryPerson">,
): OrderDeliveryPerson | null {
  const person = order.deliveryPerson;
  return person && typeof person === "object" ? person : null;
}

// Ce que renvoie GET /orders/:id/track — route publique, sans authentification.
export interface OrderTracking {
  _id: string;
  type: OrderType;
  status: OrderStatus;
  store: Store;
  dailyNumber: number;
  client: { fullName: string };
  items: OrderItem[];
  remark?: string;
  deliveryFee?: number;
  appliedPromo?: OrderPromo;
  discountAmount?: number;
  totalPrice: number;
  completedAt: string | null;
  createdAt: string;
}

// Payload de création — items simplifiés : le serveur résout prix/noms,
// le client n'envoie que des IDs et des choix (voir utils/pricing.ts backend)
export interface CreateOrderItemPayload {
  menuItemId: string;
  variantSelected: Record<string, string>;
  selectedExtras: { extraId: string }[];
  excludedIngredients: string[];
  quantity: number;
  formula?: { formulaId: string; choices: Record<string, string> };
}

/**
 * `promoCode` est une CHAÎNE et rien d'autre.
 *
 * Ni pourcentage ni montant : le serveur les résout depuis la base, exactement
 * comme il le fait pour les prix d'articles. Envoyer un montant depuis le
 * navigateur reviendrait à laisser le client décider de sa remise.
 */
export type CreateOrderPayload =
  | {
      type: "dine_in";
      table: string;
      client: { fullName: string };
      remark?: string;
      promoCode?: string;
      items: CreateOrderItemPayload[];
    }
  | {
      type: "takeaway";
      store: Store;
      client: { fullName: string; phone: string };
      remark?: string;
      promoCode?: string;
      items: CreateOrderItemPayload[];
    }
  | {
      type: "delivery";
      store: Store;
      client: { fullName: string; phone: string; address: string };
      remark?: string;
      promoCode?: string;
      items: CreateOrderItemPayload[];
    };

export type OrdersScope = "active" | "service" | "all";

export interface OrdersQueryParams {
  status?: OrderStatus;
  type?: OrderType;
  store?: Store;
  scope?: OrdersScope;
  page?: number;
  limit?: number;
}

// --- Service (compteur) ---

export interface CounterState {
  store: Store;
  value: number;
  lastResetAt: string | null;
}

export interface ServiceStats {
  store: Store;
  serviceStartedAt: string | null;
  lastOrderNumber: number;
  orders: number;
  completed: number;
  revenue: number;
  /** Total des remises accordées sur le service. Informatif : `revenue` est déjà net. */
  discounts?: number;
  averageBasket: number;
  byStatus: Partial<Record<OrderStatus, number>>;
  byType: { _id: OrderType; count: number; revenue: number }[];
  topItems: { name: string; quantity: number }[];
}

// --- Historique (agrégations du calendrier) ---

export interface HistoryYearEntry {
  year: number;
  count: number;
  totalSales: number;
}

export interface HistoryMonthEntry {
  month: number;
  count: number;
  totalSales: number;
}

export interface HistoryDayEntry {
  day: number;
  count: number;
  totalSales: number;
}
