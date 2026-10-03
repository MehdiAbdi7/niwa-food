import type { Store } from "./store";

// Miroir de StoreStatus dans utils/storeStatus.ts côté backend.
// Un magasin sans document en base est renvoyé ouvert par l'API : le front n'a
// donc jamais à gérer un état "inconnu", seulement ouvert ou fermé.
export interface StoreStatus {
  store: Store;
  acceptingOrders: boolean;
  closedMessage: string | null;
}

export interface UpdateStoreStatusPayload {
  store: Store;
  acceptingOrders: boolean;
  // Toujours envoyé, y compris à null : sans ça, l'ancien message resterait
  // collé à la fermeture suivante (voir setStoreStatus côté backend).
  closedMessage?: string | null;
}
