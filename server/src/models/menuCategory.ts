import { model, Model, Schema } from "mongoose";
import { IMenuCategory } from "../types/models/menuCategory.js";

type MenuCategoryModel = Model<IMenuCategory>;

const menuCategorySchema = new Schema<IMenuCategory, MenuCategoryModel>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    order: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const MenuCategory = model<IMenuCategory, MenuCategoryModel>(
  "MenuCategory",
  menuCategorySchema,
);
