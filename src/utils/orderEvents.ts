import type { HydratedDocument } from "mongoose";
import { io } from "../config/socket.js";
import { Store } from "../config/stores.js";
import { IOrder } from "../types/models/order.js";
import { CounterState } from "./dailyNumber.js";
// import type : effacé à la compilation, donc aucun cycle d'import avec
// storeStatus.ts même si celui-ci venait un jour à émettre des événements.
import type { StoreStatus } from "./storeStatus.js";

type OrderDoc = HydratedDocument<IOrder>;

// Événements poussés vers le client qui suit sa commande.
// order_updated couvre tout ce qui change le contenu ou le montant sans
// changer le statut : ajout d'articles par le staff, frais de livraison fixés.
export type OrderTrackingEvent =
  | "order_ready"
  | "order_out_for_delivery"
  | "order_completed"
  | "order_cancelled"
  | "order_updated";

// Toute mutation d'une commande DOIT passer par ces helpers.
// Sans diffusion, deux postes ouverts sur le même dashboard divergent
// silencieusement (le poste B ne voit pas ce que le poste A vient de faire).

export function emitOrderCreated(order: OrderDoc): void {
  io.to(`dashboard:${order.store}`).emit("new_order", order);
}

export function emitOrderUpdated(order: OrderDoc): void {
  io.to(`dashboard:${order.store}`).emit("order_updated", order);
}

export function emitOrderDeleted(order: OrderDoc): void {
  io.to(`dashboard:${order.store}`).emit("order_deleted", {
    _id: order._id,
    store: order.store,
  });
}

// Notifie les autres postes qu'un nouveau service vient d'être ouvert,
// pour qu'ils vident leur vue courante au lieu d'afficher l'ancien service.
export function emitCounterReset(state: CounterState): void {
  io.to(`dashboard:${state.store}`).emit("counter_reset", state);
}

/**
 * Ouverture/fermeture des commandes en ligne.
 *
 * Diffusé au dashboard du magasin concerné : sans ça, un second poste
 * continuerait d'afficher « commandes ouvertes » alors que le premier vient de
 * couper, et l'équipe se contredirait au téléphone.
 *
 * Le payload complet est envoyé (et non un simple signal comme pour le
 * tracking) : il ne contient aucune donnée sensible, et la room dashboard:*
 * exige déjà un JWT valide au handshake.
 */
export function emitStoreStatusChanged(status: StoreStatus): void {
  io.to(`dashboard:${status.store}`).emit("store_status_changed", status);
}

// Événements destinés au client public qui suit sa commande.
// Le document complet n'est PAS envoyé : la room order:<id> est rejoignable
// par quiconque connaît l'id, et le payload contiendrait le téléphone et
// l'adresse du client. Le front ne reçoit qu'un signal, et refetche
// GET /orders/:id/track, qui applique déjà la bonne projection.
export function emitOrderTracking(
  order: OrderDoc,
  event: OrderTrackingEvent,
): void {
  io.to(`order:${order._id}`).emit(event, { _id: order._id, event });
}

export type { Store };
