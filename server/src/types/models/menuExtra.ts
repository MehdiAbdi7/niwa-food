import { Types } from "mongoose";

export interface IMenuExtra {
  name: string;
  type: Types.ObjectId; // ref: MenuExtraType
  priceType: "fixed" | "bySize";
  price?: number;
  pricesBySize?: { M: number; L: number };
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}
