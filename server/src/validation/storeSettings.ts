import { z } from "zod";
import { STORES } from "../config/stores.js";

// `store` optionnel, même convention que resetCounterSchema : un employee est
// ramené à son magasin, un admin doit préciser lequel.
export const updateStoreStatusSchema = z.object({
  store: z.enum(STORES).optional(),
  acceptingOrders: z.boolean(),
  // Court volontairement : ce message s'affiche dans un bandeau sur mobile.
  closedMessage: z.string().trim().max(140).nullable().optional(),
});

export type UpdateStoreStatusInput = z.infer<typeof updateStoreStatusSchema>;
