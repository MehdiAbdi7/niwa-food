import { Store } from "../../config/stores.js";

export interface IStoreSettings {
  store: Store;
  // Porte d'entrée des commandes CLIENT. N'affecte ni le service en cours,
  // ni les commandes déjà passées, ni la prise de commande par le staff.
  acceptingOrders: boolean;
  // Message affiché au client à la place du bouton de commande. Null = message
  // générique côté utils/storeStatus.ts.
  closedMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
