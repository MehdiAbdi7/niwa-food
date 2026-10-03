import { z } from "zod/v4";
import { STORES } from "../config/stores.js";

const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/;

// Un livreur est traité comme un employé de ce point de vue : il appartient à
// un magasin. Seul l'admin est transverse.
const roleSchema = z.enum(["admin", "employee", "delivery"]);

const storeRule = {
  message:
    "store est requis si role=employee ou role=delivery, et doit être absent si role=admin",
  path: ["store"],
};

// LOGIN
export const loginSchema = z.object({
  email: z.email("Email must be valid").trim().toLowerCase(),
  password: z.string().regex(passwordRegex, "Password isn't strong enough"),
});

// REGISTER (créé par un admin depuis le dashboard)
// Le livreur passe par la même route : email fictif + mot de passe fort, comme
// n'importe quel compte. Son `tel` est déjà obligatoire, c'est par là que le
// staff le joint pendant le service.
export const registerSchema = loginSchema
  .extend({
    firstname: z.string().min(3).trim(),
    lastname: z.string().min(1).trim(),
    tel: z.string().min(10),
    role: roleSchema.default("employee"),
    store: z.enum(STORES).optional(),
  })
  .refine(
    (data) =>
      data.role === "admin"
        ? data.store === undefined
        : data.store !== undefined,
    storeRule,
  );

// UPDATE d'un utilisateur par un admin (infos + rôle + magasin).
// Pas de `.refine` ici : tous les champs sont optionnels, donc la cohérence
// role/store dépend de l'état en base — elle est validée par le hook
// pre("validate") du modèle, seul endroit qui voit le document final.
export const updateUserSchema = z.object({
  firstname: z.string().min(3).max(30).trim().optional(),
  lastname: z.string().min(1).max(30).trim().optional(),
  email: z.email("Email must be valid").trim().toLowerCase().optional(),
  tel: z.string().min(10).optional(),
  role: roleSchema.optional(),
  store: z.enum(STORES).optional(),
});

// Filtres de la page Utilisateurs. `role=delivery` sert aussi au sélecteur de
// livreur de la fiche commande.
export const usersQuerySchema = z.object({
  store: z.enum(STORES).optional(),
  role: roleSchema.optional(),
});

// UPDATE PROFILE INFO (par l'utilisateur lui-même)
export const updateProfileSchema = z.object({
  firstname: z.string().min(3).max(30).trim().optional(),
  lastname: z.string().min(1).max(30).trim().optional(),
  email: z.email("Email must be valid").trim().toLowerCase().optional(),
  tel: z.string().min(10).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UsersQuery = z.infer<typeof usersQuerySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
