import { z } from "zod";

export const createMenuCategorySchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(50),
  isActive: z.boolean().default(true).optional(),
});

export const updateMenuCategorySchema = createMenuCategorySchema.partial();

export type CreateMenuCategoryInput = z.infer<typeof createMenuCategorySchema>;
export type UpdateMenuCategoryInput = z.infer<typeof updateMenuCategorySchema>;
