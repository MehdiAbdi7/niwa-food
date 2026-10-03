import type { Store } from "./store";

/**
 * Rôles de l'application.
 *
 * - admin    : tout
 * - employee : le service de son magasin
 * - delivery : UNIQUEMENT ses propres courses, sur /livraison
 *
 * `delivery` est un prestataire externe, pas un membre du restaurant : aucune
 * route du dashboard ne lui est ouverte, côté API comme côté pages.
 */
export type UserRole = "admin" | "employee" | "delivery";

export interface User {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  tel: string;
  role: UserRole;
  // Présent pour employee ET delivery, absent pour admin.
  store?: Store;
  createdAt: string;
  updatedAt: string;
}

/** Projection de GET /auth/delivery-persons — pas un User complet. */
export interface DeliveryPerson {
  _id: string;
  firstname: string;
  lastname: string;
  tel: string;
  store: Store;
}

export interface CreateUserPayload {
  firstname: string;
  lastname: string;
  email: string;
  tel: string;
  password: string;
  role: UserRole;
  store?: Store;
}

export type UpdateUserPayload = Partial<
  Pick<
    CreateUserPayload,
    "firstname" | "lastname" | "email" | "tel" | "role" | "store"
  >
>;

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  employee: "Employé",
  delivery: "Livreur",
};
