import { model, Model, Schema } from "mongoose";
import { IMenuExtraType } from "../types/models/menuExtraType.js";

type MenuExtraTypeModel = Model<IMenuExtraType>;

const menuExtraTypeSchema = new Schema<IMenuExtraType, MenuExtraTypeModel>(
  {
    name: { type: String, required: true, trim: true, unique: true },
  },
  { timestamps: true },
);

export const MenuExtraType = model<IMenuExtraType, MenuExtraTypeModel>(
  "MenuExtraType",
  menuExtraTypeSchema,
);
