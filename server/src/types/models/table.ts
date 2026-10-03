import { Types } from "mongoose";
import { Store } from "../../config/stores.js";

export interface ITable {
  tableN: number;
  store: Store;
  status: "free" | "occupied";
  currentOrderId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}
