import { StatusCodes } from "http-status-codes";
import { StoreSettings } from "../models/storeSettings.js";
import { STORES, type Store } from "../config/stores.js";

export interface StoreStatus {
  store: Store;
  acceptingOrders: boolean;
  closedMessage: string | null;
}

export const DEFAULT_CLOSED_MESSAGE =
  "Ce restaurant ne prend plus de commandes en ligne pour le moment.";

function toStatus(
  store: Store,
  settings: { acceptingOrders: boolean; closedMessage?: string | null } | null,
): StoreStatus {
  // Absence de document = ouvert. Même parti pris que getCounterState : on lit
  // avec un défaut au lieu d'upserter à la lecture, sinon une simple
  // consultation de la carte publique créerait des documents en base.
  return {
    store,
    acceptingOrders: settings?.acceptingOrders ?? true,
    closedMessage: settings?.closedMessage ?? null,
  };
}

export async function getStoreStatus(store: Store): Promise<StoreStatus> {
  return toStatus(store, await StoreSettings.findOne({ store }));
}

// Une seule requête pour tous les magasins : la carte publique interroge cette
// route à chaque chargement, inutile d'en faire une par magasin.
export async function getAllStoreStatuses(): Promise<StoreStatus[]> {
  const all = await StoreSettings.find();
  const byStore = new Map(all.map((settings) => [settings.store, settings]));

  return STORES.map((store) => toStatus(store, byStore.get(store) ?? null));
}

export async function setStoreStatus(
  store: Store,
  acceptingOrders: boolean,
  closedMessage: string | null = null,
): Promise<StoreStatus> {
  const settings = await StoreSettings.findOneAndUpdate(
    { store },
    // closedMessage toujours réécrit, y compris à null : sans ça, un ancien
    // "Fermé pour panne de four" resterait collé à la fermeture suivante.
    { $set: { acceptingOrders, closedMessage } },
    { new: true, upsert: true },
  );

  return toStatus(store, settings);
}

/**
 * Refuse la création d'une commande sur un magasin fermé.
 *
 * 503 et non 403 : ce n'est pas un problème de droits, c'est un service
 * temporairement indisponible. La distinction compte pour le front, qui doit
 * dire « on est fermé » et non « accès refusé ».
 *
 * À n'appeler QUE pour un appelant anonyme : le staff commande toujours (voir
 * createOrder).
 */
export async function assertStoreAcceptsOrders(store: Store): Promise<void> {
  const status = await getStoreStatus(store);

  if (!status.acceptingOrders) {
    throw Object.assign(
      new Error(status.closedMessage ?? DEFAULT_CLOSED_MESSAGE),
      { statusCode: StatusCodes.SERVICE_UNAVAILABLE },
    );
  }
}
