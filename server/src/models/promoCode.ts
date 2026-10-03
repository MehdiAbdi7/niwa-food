import { model, Model, Schema } from "mongoose";
import { IPromoCode } from "../types/models/promoCode.js";
import { ORDER_TYPES } from "../config/orderTypes.js";

type PromoCodeModel = Model<IPromoCode>;

const promoCodeSchema = new Schema<IPromoCode, PromoCodeModel>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // uppercase:true côté schéma NE SUFFIT PAS : il normalise l'écriture,
      // pas la lecture. Une recherche findOne({ code: "niwa10" }) resterait
      // sans résultat. C'est normalizePromoCode() (utils/promo.ts) qui est la
      // règle, appliquée des deux côtés — celui-ci n'est qu'un filet.
      uppercase: true,
      minlength: 2,
      maxlength: 30,
    },
    description: { type: String, trim: true, maxlength: 120 },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },

    maxDiscountAmount: { type: Number, min: 0 },
    minOrderAmount: { type: Number, min: 0 },

    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },

    maxUses: { type: Number, min: 1, default: null },

    orderTypes: {
      type: [String],
      enum: ORDER_TYPES,
      default: [],
    },

    usedCount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

/**
 * Cohérence des bornes de validité.
 *
 * Un code dont la fin précède le début n'est refusé par aucune des clauses de
 * resolvePromoCode prises isolément : il serait simplement invalide en
 * permanence, sans que l'admin comprenne pourquoi. Autant le refuser à la
 * saisie, avec un message qui dit quoi corriger.
 */
promoCodeSchema.pre("validate", function () {
  if (this.startsAt && this.endsAt && this.endsAt <= this.startsAt) {
    throw new Error(
      "La date de fin doit être postérieure à la date de début",
    );
  }
});

/**
 * Index de la recherche par code.
 *
 * `unique: true` en crée déjà un — celui-ci est donc redondant et n'est PAS
 * redéclaré. C'est volontaire : deux index sur le même champ coûteraient à
 * l'écriture sans rien rapporter à la lecture.
 */

export const PromoCode = model<IPromoCode, PromoCodeModel>(
  "PromoCode",
  promoCodeSchema,
);
