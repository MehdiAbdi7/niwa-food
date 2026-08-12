import { Store } from "../config/stores.js";

interface ScopableUser {
  role: string;
  store?: Store;
}

// Filtre Mongoose selon le rôle : admin = aucun filtre, employee = restreint
// à son propre magasin (jamais au choix du client/query param).
// On ne renvoie la clé `store` que si elle a une vraie valeur — jamais
// `{ store: undefined }`, qui n'est pas équivalent à l'absence de la clé
// pour Mongoose/TypeScript, et qui casse le typage strict des modèles
// (Table.store / Order.store sont typés `Store`, pas `string`).
export function getStoreFilter(user: ScopableUser): { store?: Store } {
  if (user.role === "admin") return {};
  return user.store ? { store: user.store } : {};
}

// Vérifie qu'un employee ne peut agir que sur une ressource de son magasin
export function assertSameStore(
  user: ScopableUser,
  resourceStore: Store,
): void {
  if (user.role !== "admin" && user.store !== resourceStore) {
    throw Object.assign(
      new Error("Vous n'avez pas accès aux ressources d'un autre magasin"),
      { statusCode: 403 },
    );
  }
}
