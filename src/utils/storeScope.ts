interface ScopableUser {
  role: string;
  store?: string;
}

// Filtre Mongoose selon le rôle : admin = aucun filtre, employee = restreint
// à son propre magasin (jamais au choix du client/query param).
export function getStoreFilter(user: ScopableUser): { store?: string } {
  return user.role === "admin" ? {} : { store: user.store };
}

// Vérifie qu'un employee ne peut agir que sur une ressource de son magasin
export function assertSameStore(
  user: ScopableUser,
  resourceStore: string,
): void {
  if (user.role !== "admin" && user.store !== resourceStore) {
    throw Object.assign(
      new Error("Vous n'avez pas accès aux ressources d'un autre magasin"),
      { statusCode: 403 },
    );
  }
}
