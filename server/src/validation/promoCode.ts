import { z } from "zod";
import { ORDER_TYPES } from "../config/orderTypes.js";

/**
 * Le code tel qu'il est saisi, avant normalisation.
 *
 * Restreint à [A-Z0-9-] APRÈS passage en majuscules : un code sert à être
 * dicté au téléphone et recopié depuis une story. Les accents, espaces et
 * caractères exotiques ne survivent pas à ce trajet — autant les refuser tout
 * de suite plutôt que de laisser créer un code que personne n'arrivera à taper.
 */
const codeSchema = z
  .string()
  .trim()
  .min(2, "Le code doit faire au moins 2 caractères")
  .max(30)
  .transform((value) => value.replace(/\s+/g, "").toUpperCase())
  .refine((value) => /^[A-Z0-9-]+$/.test(value), {
    message: "Le code ne peut contenir que des lettres, chiffres et tirets",
  });

// z.coerce.date() accepte aussi bien une chaîne ISO (ce qu'envoie le front)
// qu'un timestamp. nullable() est indispensable : effacer une échéance depuis
// le dashboard passe par un null explicite, pas par une clé absente — sinon
// l'ancienne date resterait en base.
const optionalDate = z.coerce.date().nullable().optional();

const basePromoCodeSchema = z.object({
  code: codeSchema,
  description: z.string().trim().max(120).optional(),
  discountPercent: z
    .number()
    .int("Le pourcentage doit être un entier")
    .min(1)
    .max(100),

  maxDiscountAmount: z.number().int().min(0).nullable().optional(),
  minOrderAmount: z.number().int().min(0).nullable().optional(),

  startsAt: optionalDate,
  endsAt: optionalDate,

  maxUses: z.number().int().min(1).nullable().optional(),

  orderTypes: z.array(z.enum(ORDER_TYPES)).default([]).optional(),

  active: z.boolean().default(true).optional(),
});

// usedCount n'est JAMAIS accepté depuis une requête, ni à la création ni à la
// mise à jour : c'est un compteur, pas un réglage. Le laisser passer
// permettrait de recharger un code épuisé en le « modifiant ».
export const createPromoCodeSchema = basePromoCodeSchema.refine(
  (data) =>
    !data.startsAt || !data.endsAt || data.endsAt > data.startsAt,
  {
    message: "La date de fin doit être postérieure à la date de début",
    path: ["endsAt"],
  },
);

// Pas de .refine ici : tous les champs étant optionnels, la cohérence des
// dates dépend de l'état en base. Elle est validée par le pre("validate") du
// modèle, seul endroit qui voit le document final — même parti pris que
// updateUserSchema pour le couple role/store.
export const updatePromoCodeSchema = basePromoCodeSchema.partial();

/**
 * Vérification d'un code AVANT l'envoi de la commande.
 *
 * `itemsTotal` vient du client, et c'est sans conséquence : cette route ne fait
 * qu'un aperçu. Le montant réellement appliqué est recalculé à la création de
 * la commande, à partir des prix résolus en base (voir createOrder).
 */
export const validatePromoCodeQuerySchema = z.object({
  code: z.string().trim().min(2).max(30),
  itemsTotal: z.coerce.number().int().min(0).max(1_000_000),
  orderType: z.enum(ORDER_TYPES),
});

export type CreatePromoCodeInput = z.infer<typeof createPromoCodeSchema>;
export type UpdatePromoCodeInput = z.infer<typeof updatePromoCodeSchema>;
export type ValidatePromoCodeQuery = z.infer<
  typeof validatePromoCodeQuerySchema
>;
