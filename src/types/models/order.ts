import { Types } from "mongoose";
import { Store } from "../../config/stores.js";

export interface IOrderItemExtra {
  extraId: Types.ObjectId; // ref MenuExtra
  name: string; // snapshot du nom au moment de la commande
  price: number; // snapshot du prix au moment de la commande
}

export interface IOrderItem {
  menuItemId: Types.ObjectId; // ref MenuItem
  name: string; // snapshot du nom du produit
  variantSelected: Record<string, string>; // ex: { taille: "M", viande: "poulet" }
  unitPrice: number; // snapshot du prix de CETTE variante au moment de la commande
  selectedExtras: IOrderItemExtra[];
  excludedIngredients: string[];
  quantity: number;
  isKidsMenu?: boolean;
}

export interface IOrderClient {
  fullName: string;
  phone?: string; // requis pour takeaway/delivery
  address?: string; // requis pour delivery
}

export interface IOrder {
  type: "dine_in" | "takeaway" | "delivery";
  status: "pending" | "ready" | "out_for_delivery" | "completed" | "cancelled";
  store: Store;
  dailyNumber: number; // numéro de commande unique par jour ET par magasin
  table?: Types.ObjectId; // ref Table, requis si type=dine_in
  client: IOrderClient;
  items: IOrderItem[];
  remark?: string;
  deliveryFee?: number; // requis si type=delivery
  totalPrice: number; // calculé automatiquement (pre-save hook), inclut deliveryFee
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
