import { z } from "zod";
import { Types } from "mongoose";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "ID invalide",
});

const orderItemExtraSchema = z.object({
  extraId: objectIdSchema,
});

const orderItemSchema = z.object({
  menuItemId: objectIdSchema,
  variantSelected: z.record(z.string(), z.string()).default({}),
  selectedExtras: z.array(orderItemExtraSchema).default([]),
  excludedIngredients: z.array(z.string().trim()).default([]),
  quantity: z.number().int().min(1),
  isKidsMenu: z.boolean().default(false),
});

// Chaque type de commande a ses propres champs client obligatoires
const dineInSchema = z.object({
  type: z.literal("dine_in"),
  table: objectIdSchema,
  client: z.object({
    fullName: z.string().trim().min(1, "Le nom est requis"),
  }),
  remark: z.string().trim().optional(),
});

const takeawaySchema = z.object({
  type: z.literal("takeaway"),
  client: z.object({
    fullName: z.string().trim().min(1, "Le nom est requis"),
    phone: z.string().trim().min(10, "Le téléphone est requis"),
  }),
});

const deliverySchema = z.object({
  type: z.literal("delivery"),
  client: z.object({
    fullName: z.string().trim().min(1, "Le nom est requis"),
    phone: z.string().trim().min(10, "Le téléphone est requis"),
    address: z.string().trim().min(1, "L'adresse est requise"),
  }),
});

const commonSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Au moins un item est requis"),
});

export const createOrderSchema = z.discriminatedUnion("type", [
  dineInSchema.extend(commonSchema.shape),
  takeawaySchema.extend(commonSchema.shape),
  deliverySchema.extend(commonSchema.shape),
]);

// Pour l'ajout manuel d'items à une commande takeaway/delivery existante (pending)
export const addItemsToOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Au moins un item est requis"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "ready",
    "out_for_delivery",
    "completed",
    "cancelled",
  ]),
});

// Le staff fixe le prix de livraison manuellement quand la commande arrive (dashboard)
export const setDeliveryFeeSchema = z.object({
  deliveryFee: z.number().nonnegative("Le prix de livraison doit être positif"),
});

// --- Historique / Stats (drill-down année -> mois -> jour -> liste) ---

const historyTypeSchema = z.object({
  type: z.enum(["dine_in", "takeaway", "delivery"]),
});

export const historyYearsQuerySchema = historyTypeSchema;

export const historyMonthsQuerySchema = historyTypeSchema.extend({
  year: z.coerce.number().int().min(2000).max(2100),
});

export const historyDaysQuerySchema = historyMonthsQuerySchema.extend({
  month: z.coerce.number().int().min(1).max(12),
});

export const historyOrdersQuerySchema = historyDaysQuerySchema.extend({
  day: z.coerce.number().int().min(1).max(31),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AddItemsToOrderInput = z.infer<typeof addItemsToOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type SetDeliveryFeeInput = z.infer<typeof setDeliveryFeeSchema>;
export type HistoryYearsQuery = z.infer<typeof historyYearsQuerySchema>;
export type HistoryMonthsQuery = z.infer<typeof historyMonthsQuerySchema>;
export type HistoryDaysQuery = z.infer<typeof historyDaysQuerySchema>;
export type HistoryOrdersQuery = z.infer<typeof historyOrdersQuerySchema>;
