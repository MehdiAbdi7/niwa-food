import { model, Model, Schema } from "mongoose";
import { IMenuExtra } from "../types/models/menuExtra.js";

type MenuExtraModel = Model<IMenuExtra>;

const menuExtraSchema = new Schema<IMenuExtra, MenuExtraModel>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: Schema.Types.ObjectId, ref: "MenuExtraType", required: true },
    priceType: { type: String, enum: ["fixed", "bySize"], required: true },
    price: { type: Number, min: 0 },
    pricesBySize: {
      M: { type: Number, min: 0 },
      L: { type: Number, min: 0 },
    },
    available: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const MenuExtra = model<IMenuExtra, MenuExtraModel>(
  "MenuExtra",
  menuExtraSchema,
);
