import { z } from "zod/v4";
import { STORES } from "../config/stores.js";

const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/;

const storeRule = {
  message:
    "store est requis si role=employee, et doit être absent si role=admin",
  path: ["store"],
};

// LOGIN
export const loginSchema = z.object({
  email: z.email("Email must be valid").trim().toLowerCase(),
  password: z.string().regex(passwordRegex, "Password isn't strong enough"),
});

// REGISTER (créé par un admin depuis le dashboard)
export const registerSchema = loginSchema
  .extend({
    firstname: z.string().min(3).trim(),
    lastname: z.string().min(1).trim(),
    tel: z.string().min(10),
    role: z.enum(["admin", "employee"]).default("employee"),
    store: z.enum(STORES).optional(),
  })
  .refine(
    (data) =>
      data.role === "employee"
        ? data.store !== undefined
        : data.store === undefined,
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
  role: z.enum(["admin", "employee"]).optional(),
  store: z.enum(STORES).optional(),
});

// Filtres de la page Utilisateurs
export const usersQuerySchema = z.object({
  store: z.enum(STORES).optional(),
  role: z.enum(["admin", "employee"]).optional(),
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
