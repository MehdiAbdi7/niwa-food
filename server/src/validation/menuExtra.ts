import { z } from "zod";
import { Types } from "mongoose";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "ID invalide",
});

const baseMenuExtraSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(50),
  type: objectIdSchema,
  priceType: z.enum(["fixed", "bySize"]),
  price: z.number().nonnegative().optional(),
  pricesBySize: z
    .object({
      M: z.number().nonnegative(),
      L: z.number().nonnegative(),
    })
    .optional(),
  available: z.boolean().default(true).optional(),
});

export const createMenuExtraSchema = baseMenuExtraSchema.refine(
  (data) =>
    data.priceType === "fixed"
      ? data.price !== undefined
      : data.pricesBySize !== undefined,
  {
    message:
      "price est requis si priceType=fixed, pricesBySize est requis si priceType=bySize",
  },
);

export const updateMenuExtraSchema = baseMenuExtraSchema.partial();

export type CreateMenuExtraInput = z.infer<typeof createMenuExtraSchema>;
export type UpdateMenuExtraInput = z.infer<typeof updateMenuExtraSchema>;
