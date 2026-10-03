import { z } from "zod";

export const createMenuExtraTypeSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(50),
});

export const updateMenuExtraTypeSchema = createMenuExtraTypeSchema.partial();

export type CreateMenuExtraTypeInput = z.infer<
  typeof createMenuExtraTypeSchema
>;
export type UpdateMenuExtraTypeInput = z.infer<
  typeof updateMenuExtraTypeSchema
>;
