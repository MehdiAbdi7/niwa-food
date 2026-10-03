import { z } from "zod";
import { Types } from "mongoose";
import { STORES } from "../config/stores.js";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "ID invalide",
});

export const createTableSchema = z.object({
  tableN: z.number().int().min(1, "Le numéro de table doit être positif"),
  store: z.enum(STORES),
});

export const updateTableSchema = z.object({
  tableN: z.number().int().min(1).optional(),
  store: z.enum(STORES).optional(),
  status: z.enum(["free", "occupied"]).optional(),
  currentOrderId: objectIdSchema.nullable().optional(),
});

// Dashboard : `store` sert uniquement à l'admin pour cibler un magasin.
// Un employee reste forcé sur le sien, quoi qu'il envoie.
export const tablesQuerySchema = z.object({
  store: z.enum(STORES).optional(),
});

export const publicTablesQuerySchema = z.object({
  store: z.enum(STORES),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type TablesQuery = z.infer<typeof tablesQuerySchema>;
export type PublicTablesQuery = z.infer<typeof publicTablesQuerySchema>;
