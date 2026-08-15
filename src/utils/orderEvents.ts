import type { HydratedDocument } from "mongoose";
import { io } from "../config/socket.js";
import { Store } from "../config/stores.js";
import { IOrder } from "../types/models/order.js";
import { CounterState } from "./dailyNumber.js";

type OrderDoc = HydratedDocument<IOrder>;

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

// Événements destinés au client public qui suit sa commande
export function emitOrderTracking(
  order: OrderDoc,
  event: "order_ready" | "order_out_for_delivery",
): void {
  io.to(`order:${order._id}`).emit(event, order);
}

export type { Store };
