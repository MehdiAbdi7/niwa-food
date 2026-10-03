import type { OrderType } from "@/types/order";

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: "Sur place",
  takeaway: "À emporter",
  delivery: "Livraison",
};

export const ORDER_TYPE_ICONS: Record<OrderType, string> = {
  dine_in: "icon-[mdi--silverware-fork-knife]",
  takeaway: "icon-[mdi--bag-checked]",
  delivery: "icon-[mdi--moped-outline]",
};
