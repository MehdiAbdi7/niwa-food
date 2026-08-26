import { z } from "zod";
import { Types } from "mongoose";
import { STORES } from "../config/stores.js";
import { ORDER_TYPES } from "../config/orderTypes.js";
import { getDaysInMonth } from "../utils/serviceDate.js";

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

const orderTypeSchema = z.enum(ORDER_TYPES);

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

/**
 * Changement de statut, avec assignation de livreur en option.
 *
 * `deliveryPerson` est accepté ICI pour que le passage en livraison et le
 * choix du livreur tiennent en un seul appel — c'est un geste unique côté
 * comptoir, en faire deux requêtes ouvrirait une fenêtre où la commande est
 * partie sans que personne ne sache avec qui.
 *
 * Trois valeurs distinctes, et la nuance compte :
 *   - absent  -> ne touche pas à l'assignation existante
 *   - null    -> retire le livreur (course reprise par le staff)
 *   - un id   -> assigne, après vérification du rôle et du magasin
 */
export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  deliveryPerson: objectIdSchema.nullable().optional(),
});

/**
 * Correction d'assignation, hors changement de statut.
 *
 * ALLOWED_TRANSITIONS interdit out_for_delivery -> out_for_delivery : sans
 * cette route, une erreur de livreur serait irrattrapable une fois la commande
 * partie.
 */
export const setDeliveryPersonSchema = z.object({
  deliveryPerson: objectIdSchema.nullable(),
});

/**
 * Recherche publique d'une commande par son numéro du jour.
 *
 * `dailyNumber` seul ne désigne rien : il repart à 1 à chaque service et
 * n'est unique que PAR MAGASIN. D'où le couple obligatoire — et le contrôleur
 * ajoute une troisième borne, le statut, pour lever l'ambiguïté entre deux
 * services (voir lookupOrder).
 */
export const lookupOrderQuerySchema = z.object({
  store: z.enum(STORES),
  // Borné haut : au-delà, ce n'est plus un numéro de commande mais un test.
  dailyNumber: z.coerce.number().int().min(1).max(9999),
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

/* ------------------------------------------------------------------ */
/*  Historique                                                         */
/* ------------------------------------------------------------------ */

// Agrégations qui alimentent le CALENDRIER (compteurs par case). Elles ne
// renvoient jamais de commandes, seulement des totaux — d'où l'absence de
// pagination : douze mois ou trente et un jours tiennent dans une réponse.
const historyBaseSchema = z.object({
  // OPTIONNEL = « Tous les types ». Le contrôleur le traduit alors en
  // `$in: ORDER_TYPES` plutôt qu'en absence de clé — voir
  // resolveHistoryTypeFilter, et le commentaire sur l'index dans models/order.ts.
  type: orderTypeSchema.optional(),
  store: z.enum(STORES).optional(),
});

export const historyYearsQuerySchema = historyBaseSchema;

export const historyMonthsQuerySchema = historyBaseSchema.extend({
  year: z.coerce.number().int().min(2000).max(2100),
});

export const historyDaysQuerySchema = historyMonthsQuerySchema.extend({
  month: z.coerce.number().int().min(1).max(12),
});

/**
 * LISTE unifiée des commandes de l'historique.
 *
 * Un seul endpoint pour les trois niveaux de précision, le niveau étant déduit
 * des paramètres présents :
 *   ?year=2026              -> toute l'année
 *   ?year=2026&month=3      -> tout le mois
 *   ?year=2026&month=3&day=14 -> le jour
 *
 * Trois contrôleurs quasi identiques à une borne de date près auraient
 * divergé à la première évolution (ajout du tri, de la recherche...).
 */
export const historyQuerySchema = historyBaseSchema
  .extend({
    year: z.coerce.number().int().min(2000).max(2100),
    month: z.coerce.number().int().min(1).max(12).optional(),
    day: z.coerce.number().int().min(1).max(31).optional(),

    // Numéro de commande ou nom du client. Borné : au-delà, ce n'est plus une
    // recherche mais une tentative de faire travailler le serveur pour rien.
    search: z.string().trim().max(60).optional(),

    sortBy: z.enum(["date", "amount", "number"]).default("date"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),

    page: z.coerce.number().int().min(1).default(1),
    // max 100 : `skip` devient coûteux sur de grands décalages, et une page de
    // 500 commandes n'est de toute façon lue par personne.
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((data) => data.day === undefined || data.month !== undefined, {
    message: "`month` est requis lorsque `day` est fourni",
    path: ["month"],
  })
  .refine(
    (data) =>
      data.day === undefined ||
      data.month === undefined ||
      data.day <= getDaysInMonth(data.year, data.month),
    {
      // Sans ce contrôle, un ?month=2&day=31 produirait une plage sur le 3 mars
      // (Date.UTC reporte le débordement) et renverrait silencieusement les
      // commandes d'un autre jour.
      message: "Ce jour n'existe pas dans le mois demandé",
      path: ["day"],
    },
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AddItemsToOrderInput = z.infer<typeof addItemsToOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type SetDeliveryPersonInput = z.infer<typeof setDeliveryPersonSchema>;
export type SetDeliveryFeeInput = z.infer<typeof setDeliveryFeeSchema>;
export type LookupOrderQuery = z.infer<typeof lookupOrderQuerySchema>;
export type ResetCounterInput = z.infer<typeof resetCounterSchema>;
export type OrdersQuery = z.infer<typeof ordersQuerySchema>;
export type StoreScopeQuery = z.infer<typeof storeScopeQuerySchema>;
export type HistoryYearsQuery = z.infer<typeof historyYearsQuerySchema>;
export type HistoryMonthsQuery = z.infer<typeof historyMonthsQuerySchema>;
export type HistoryDaysQuery = z.infer<typeof historyDaysQuerySchema>;
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
