import { z } from "zod";
import { Types } from "mongoose";
import { STORES } from "../config/stores.js";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "ID invalide",
});

const orderStatusSchema = z.enum([
  "pending",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
]);

const orderTypeSchema = z.enum(["dine_in", "takeaway", "delivery"]);

const orderItemExtraSchema = z.object({
  extraId: objectIdSchema,
});

// Le client n'envoie que l'identifiant de la formule et ses choix.
// Prix, composition et éligibilité sont résolus côté serveur.
const orderItemFormulaSchema = z.object({
  formulaId: z.string().trim().min(1),
  choices: z.record(z.string(), z.string()).default({}),
});

const orderItemSchema = z.object({
  menuItemId: objectIdSchema,
  variantSelected: z.record(z.string(), z.string()).default({}),
  selectedExtras: z.array(orderItemExtraSchema).default([]),
  excludedIngredients: z.array(z.string().trim()).default([]),
  quantity: z.number().int().min(1),
  formula: orderItemFormulaSchema.optional(),
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
  remark: z.string().trim().optional(),
});

const deliverySchema = z.object({
  type: z.literal("delivery"),
  store: z.enum(STORES),
  client: z.object({
    fullName: z.string().trim().min(1, "Le nom est requis"),
    phone: z.string().trim().min(10, "Le téléphone est requis"),
    address: z.string().trim().min(1, "L'adresse est requise"),
  }),
  remark: z.string().trim().optional(),
});

const commonSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Au moins un item est requis"),
});

export const createOrderSchema = z.discriminatedUnion("type", [
  dineInSchema.extend(commonSchema.shape),
  takeawaySchema.extend(commonSchema.shape),
  deliverySchema.extend(commonSchema.shape),
]);

// Pour l'ajout manuel d'items à une commande existante depuis le dashboard
export const addItemsToOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Au moins un item est requis"),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
});

// Le staff fixe le prix de livraison manuellement quand la commande arrive
export const setDeliveryFeeSchema = z.object({
  deliveryFee: z.number().nonnegative("Le prix de livraison doit être positif"),
});

// --- Liste des commandes (dashboard) ---
// scope=active  -> uniquement les commandes encore à traiter (vue opérationnelle)
// scope=service -> tout ce qui a été créé depuis l'ouverture du service courant
// scope=all     -> aucune borne temporelle (recherche/debug, paginé)
export const ordersQuerySchema = z.object({
  status: orderStatusSchema.optional(),
  type: orderTypeSchema.optional(),
  store: z.enum(STORES).optional(),
  scope: z.enum(["active", "service", "all"]).default("active"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

// --- Service (compteur) ---
// `store` est optionnel : un employee est de toute façon ramené à son magasin,
// et un admin sans `store` reçoit l'état des deux magasins.
export const storeScopeQuerySchema = z.object({
  store: z.enum(STORES).optional(),
});

// force : réservé admin, permet d'ouvrir un service malgré des commandes en cours
export const resetCounterSchema = z.object({
  store: z.enum(STORES).optional(),
  force: z.boolean().default(false),
});

// --- Historique / Stats (drill-down année -> mois -> jour -> liste) ---
const historyTypeSchema = z.object({
  type: orderTypeSchema,
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
export type OrdersQuery = z.infer<typeof ordersQuerySchema>;
export type StoreScopeQuery = z.infer<typeof storeScopeQuerySchema>;
export type HistoryYearsQuery = z.infer<typeof historyYearsQuerySchema>;
export type HistoryMonthsQuery = z.infer<typeof historyMonthsQuerySchema>;
export type HistoryDaysQuery = z.infer<typeof historyDaysQuerySchema>;
export type HistoryOrdersQuery = z.infer<typeof historyOrdersQuerySchema>;
