import { Store, STORES } from "../config/stores.js";

interface ScopableUser {
  role: string;
  store?: Store;
}

// Filtre Mongoose selon le rôle : admin = aucun filtre, employee = restreint
// à son propre magasin (jamais au choix du client/query param).
// On ne renvoie la clé `store` que si elle a une vraie valeur — jamais
// `{ store: undefined }`, qui n'est pas équivalent à l'absence de la clé
// pour Mongoose/TypeScript, et qui casse le typage strict des modèles.
export function getStoreFilter(user: ScopableUser): { store?: Store } {
  if (user.role === "admin") return {};
  return user.store ? { store: user.store } : {};
}

// Liste des magasins qu'un utilisateur a le droit de consulter, en tenant
// compte d'un filtre demandé côté client. Un employee est toujours ramené à
// son magasin, quoi qu'il envoie en query ; un admin peut cibler un magasin
// précis ou tous les avoir.
export function resolveAccessibleStores(
  user: ScopableUser,
  requestedStore?: Store,
): Store[] {
  if (user.role === "admin") {
    return requestedStore ? [requestedStore] : [...STORES];
  }
  return user.store ? [user.store] : [];
}

/**
 * Magasin sur lequel une action d'administration doit s'appliquer.
 *
 * Un employee agit toujours sur SON magasin, quoi qu'il envoie dans le body :
 * ouvrir le service ou fermer les commandes de l'autre restaurant depuis son
 * poste n'aurait aucun sens. Un admin doit désigner sa cible explicitement —
 * null signifie « impossible de trancher », à traduire en 400 par l'appelant.
 *
 * Partagé entre l'ouverture de service et la fermeture des commandes : deux
 * actions, une seule règle d'autorisation. Cette fonction vivait auparavant en
 * privé dans order.controller.ts ; une règle d'autorisation dupliquée est une
 * règle qui finit par diverger.
 */
export function resolveTargetStore(
  user: ScopableUser,
  requested?: Store,
): Store | null {
  if (user.role === "admin") return requested ?? null;
  return user.store ?? null;
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
