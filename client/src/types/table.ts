import type { Store } from "./store";

export type TableStatus = "free" | "occupied";

export interface RestaurantTable {
  _id: string;
  tableN: number;
  store: Store;
  status: TableStatus;
  currentOrderId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Ce que renvoie GET /tables/public : le contrôleur fait .select("tableN status"),
// donc ni store, ni currentOrderId, ni timestamps. Un type distinct plutôt que
// RestaurantTable partiel, pour que le compilateur interdise de lire un champ
// qui n'arrivera jamais.
export type PublicTable = Pick<RestaurantTable, "_id" | "tableN" | "status">;

export interface CreateTablePayload {
  tableN: number;
  store: Store;
}

export type UpdateTablePayload = Partial<
  Pick<RestaurantTable, "tableN" | "store" | "status" | "currentOrderId">
>;
