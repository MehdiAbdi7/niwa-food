import { z } from "zod";
import { Types } from "mongoose";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "ID invalide",
});

const variantSchema = z.object({
  combination: z.record(z.string(), z.string()),
  price: z.number().nonnegative(),
});

const extraOptionSchema = z
  .object({
    extra: objectIdSchema,
    priceType: z.enum(["fixed", "bySize"]).optional(),
    price: z.number().nonnegative().optional(),
    pricesBySize: z
      .object({
        M: z.number().nonnegative(),
        L: z.number().nonnegative(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // Un priceType déclaré sans son prix produirait un extra à 0 DA en
      // silence : mieux vaut refuser à l'enregistrement qu'offrir du gratinage.
      if (data.priceType === "fixed") return data.price !== undefined;
      if (data.priceType === "bySize") return data.pricesBySize !== undefined;
      return true; // pas de surcharge : le prix du MenuExtra s'applique
    },
    {
      message:
        "price est requis si priceType=fixed, pricesBySize si priceType=bySize",
    },
  );

const extraGroupSchema = z.object({
  label: z.string().trim().min(1, "Le libellé du groupe est requis").max(40),
  singleChoice: z.boolean().default(false),
  options: z.array(extraOptionSchema).default([]),
});

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(100),
  description: z.string().trim().optional(),
  category: objectIdSchema,
  variants: z.array(variantSchema).min(1, "Au moins un variant est requis"),
  extraGroups: z.array(extraGroupSchema).default([]).optional(),
  // Déprécié, accepté le temps de la migration.
  availableExtras: z.array(objectIdSchema).default([]).optional(),
  removableIngredients: z.array(z.string().trim()).default([]).optional(),
  imageUrl: z.string().trim().url("URL d'image invalide").optional(),
  available: z.boolean().default(true).optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
