import { Store } from "../../config/stores.js";

/**
 * Rôles de l'application.
 *
 * - admin    : tout, y compris la gestion des comptes et du menu
 * - employee : le service (commandes, tables, historique de SON magasin)
 * - delivery : UNIQUEMENT les courses qui lui ont été assignées
 *
 * `delivery` est un prestataire externe, pas un membre du restaurant : il
 * n'accède à aucune route protégée par isStaff (voir middlewares/auth.ts).
 */
export type UserRole = "admin" | "employee" | "delivery";

export interface IUser {
  firstname: string;
  lastname?: string;
  email: string;
  tel: string;
  password: string;
  role: UserRole;
  // Requis pour employee ET delivery, absent pour admin. Pour un livreur,
  // c'est ce qui garantit qu'il ne sera jamais assigné à une course de
  // l'autre restaurant.
  store?: Store;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(plain: string): Promise<boolean>;
}
