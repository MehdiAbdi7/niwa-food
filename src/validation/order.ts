import { z } from "zod";
import { Types } from "mongoose";
import { STORES } from "../config/stores.js";

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

// dine_in : le magasin est dérivé de la table côté serveur, jamais du client
// (voir order.controller.ts::createOrder)
const dineInSchema = z.object({
  type: z.literal("dine_in"),
  table: objectIdSchema,
  client: z.object({
    fullName: z.string().trim().min(1, "Le nom est requis"),
  }),
  remark: z.string().trim().optional(),
});

// takeaway/delivery : le client choisit explicitement son magasin
const takeawaySchema = z.object({
  type: z.literal("takeaway"),
  store: z.enum(STORES),
  client: z.object({
    fullName: z.string().trim().min(1, "Le nom est requis"),
    phone: z.string().trim().min(10, "Le téléphone est requis"),
  }),
});

const deliverySchema = z.object({
  type: z.literal("delivery"),
  store: z.enum(STORES),
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

// Réservé admin : reset du compteur journalier d'un magasin précis
export const resetCounterSchema = z.object({
  store: z.enum(STORES),
});

// --- Historique / Stats (drill-down année -> mois -> jour -> liste) ---
// store optionnel : un employee sera de toute façon forcé sur son propre
// magasin dans le contrôleur ; un admin peut filtrer sur un magasin ou tout voir.
const historyTypeSchema = z.object({
  type: z.enum(["dine_in", "takeaway", "delivery"]),
  store: z.enum(STORES).optional(),
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
export type ResetCounterInput = z.infer<typeof resetCounterSchema>;
export type HistoryYearsQuery = z.infer<typeof historyYearsQuerySchema>;
export type HistoryMonthsQuery = z.infer<typeof historyMonthsQuerySchema>;
export type HistoryDaysQuery = z.infer<typeof historyDaysQuerySchema>;
export type HistoryOrdersQuery = z.infer<typeof historyOrdersQuerySchema>;
