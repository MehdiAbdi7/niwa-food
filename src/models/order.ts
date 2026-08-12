import { model, Model, Schema } from "mongoose";
import { IOrder } from "../types/models/order.js";
import { STORES } from "../config/stores.js";

type OrderModel = Model<IOrder>;

const orderItemExtraSchema = new Schema(
  {
    extraId: { type: Schema.Types.ObjectId, ref: "MenuExtra", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderItemSchema = new Schema(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: { type: String, required: true },
    variantSelected: { type: Schema.Types.Mixed, default: {} },
    unitPrice: { type: Number, required: true, min: 0 },
    selectedExtras: { type: [orderItemExtraSchema], default: [] },
    excludedIngredients: { type: [String], default: [] },
    quantity: { type: Number, required: true, min: 1 },
    isKidsMenu: { type: Boolean, default: false },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder, OrderModel>(
  {
    type: {
      type: String,
      enum: ["dine_in", "takeaway", "delivery"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "ready", "out_for_delivery", "completed", "cancelled"],
      default: "pending",
    },
    store: { type: String, enum: STORES, required: true },
    dailyNumber: { type: Number, required: true },
    table: { type: Schema.Types.ObjectId, ref: "Table" },
    client: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "La commande doit contenir au moins un item",
      },
    },
    remark: { type: String, trim: true },
    deliveryFee: { type: Number, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Calcul automatique du totalPrice avant chaque sauvegarde
orderSchema.pre("save", function () {
  const itemsTotal = this.items.reduce((sum, item) => {
    const extrasTotal = item.selectedExtras.reduce(
      (extraSum, extra) => extraSum + extra.price,
      0,
    );
    return sum + (item.unitPrice + extrasTotal) * item.quantity;
  }, 0);

  this.totalPrice = itemsTotal + (this.deliveryFee ?? 0);
});

export const Order = model<IOrder, OrderModel>("Order", orderSchema);
