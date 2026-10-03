import { model, Model, Schema } from "mongoose";
import { ITable } from "../types/models/table.js";
import { STORES } from "../config/stores.js";

type TableModel = Model<ITable>;

const tableSchema = new Schema<ITable, TableModel>(
  {
    tableN: { type: Number, required: true, min: 1 },
    store: { type: String, enum: STORES, required: true },
    status: { type: String, enum: ["free", "occupied"], default: "free" },
    currentOrderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  { timestamps: true },
);

// Un numéro de table est unique PAR magasin, pas globalement
// (la Table 1 de Kouba et la Table 1 de Chéraga sont deux tables distinctes)
tableSchema.index({ tableN: 1, store: 1 }, { unique: true });

export const Table = model<ITable, TableModel>("Table", tableSchema);
