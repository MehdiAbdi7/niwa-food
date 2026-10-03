import { model, Model, Schema } from "mongoose";
import { IMenuItem } from "../types/models/menuItem.js";

type MenuItemModel = Model<IMenuItem>;

const extraOptionSchema = new Schema(
  {
    extra: { type: Schema.Types.ObjectId, ref: "MenuExtra", required: true },
    // Tous facultatifs : absents, la tarification du MenuExtra s'applique.
    priceType: { type: String, enum: ["fixed", "bySize"] },
    price: { type: Number, min: 0 },
    pricesBySize: {
      M: { type: Number, min: 0 },
      L: { type: Number, min: 0 },
    },
  },
  { _id: false },
);

const extraGroupSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    singleChoice: { type: Boolean, default: false },
    options: { type: [extraOptionSchema], default: [] },
  },
  { _id: false },
);

const menuItemSchema = new Schema<IMenuItem, MenuItemModel>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "MenuCategory",
      required: true,
    },
    variants: [
      {
        combination: { type: Schema.Types.Mixed, default: {} },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    extraGroups: { type: [extraGroupSchema], default: [] },
    // Déprécié — voir le commentaire dans types/models/menuItem.ts.
    availableExtras: [{ type: Schema.Types.ObjectId, ref: "MenuExtra" }],
    removableIngredients: [{ type: String, trim: true }],
    imageUrl: { type: String, trim: true },
    imagePublicId: {
      type: String,
      required: false,
    },
    available: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const MenuItem = model<IMenuItem, MenuItemModel>(
  "MenuItem",
  menuItemSchema,
);
