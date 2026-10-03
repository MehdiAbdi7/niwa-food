import { cache } from "react";
import { serverFetch } from "./serverFetch";
import type { User } from "@/types/user";

/**
 * Utilisateur connecté, résolu côté serveur.
 *
 * Enveloppé dans cache() de React : le layout, une page et un layout imbriqué
 * peuvent tous appeler getSession() dans le même rendu, l'API n'est interrogée
 * qu'une fois. Sans ça, /utilisateurs déclencherait trois appels identiques.
 */
export const getSession = cache(async (): Promise<User | null> => {
  try {
    return await serverFetch<User>("/auth");
  } catch {
    // API injoignable : on traite comme « non connecté » plutôt que de faire
    // planter tout le rendu du dashboard.
    return null;
  }
});
