import type { MiddlewareAPI } from "@reduxjs/toolkit";
import { io, type Socket } from "socket.io-client";
import { api } from "@/server/api";
import { MY_DELIVERIES_TAG } from "@/features/delivery/deliveryApi";
import type { User } from "@/types/user";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000";

/**
 * Ouvre la connexion temps réel du personnel (dashboard ou livreur).
 *
 * Fichier à part, chargé à la demande par socketMiddleware : socket.io-client
 * et l'API de livraison ne servent qu'une fois un membre du personnel
 * connecté. Importés directement dans le middleware, ils partaient dans le
 * JavaScript de TOUTES les pages, y compris l'accueil d'un client qui ne se
 * connectera jamais.
 */
export function openRealtimeConnection(
  store: MiddlewareAPI,
  user: User,
): Socket {
  const isDelivery = user.role === "delivery";

  // Plus de `auth: { token }` : le token est dans un cookie httpOnly, que le
  // JavaScript ne peut pas lire. withCredentials fait joindre ce cookie au
  // handshake, où le backend le lit (voir readCookie dans config/socket.ts).
  const socket = io(SOCKET_URL, { withCredentials: true });

  socket.on("connect", () => {
    // Deux rooms mutuellement exclusives. Le backend refuse de toute façon
    // join_dashboard à un livreur, mais autant ne pas le demander : ce serait
    // suggérer que le cloisonnement est une question de politesse côté client.
    socket.emit(isDelivery ? "join_delivery" : "join_dashboard");
  });

  if (isDelivery) {
    // Un livreur n'a qu'un seul écran, et une seule chose à savoir : ce qui
    // change dans SES courses. Le backend émet un signal seul, le refetch
    // applique le filtre `deliveryPerson: moi`.
    socket.on("delivery_updated", () => {
      store.dispatch(api.util.invalidateTags([MY_DELIVERIES_TAG]));
    });

    return socket;
  }

  // Le socket ne pousse pas les données dans le store : il invalide les tags
  // RTK Query, qui refetche. Une seule source de vérité pour les commandes,
  // qu'elles arrivent par socket ou par requête classique.
  socket.on("new_order", () => {
    store.dispatch(
      api.util.invalidateTags(["Order", "ServiceStats", "Counter"]),
    );
  });

  socket.on("order_updated", () => {
    store.dispatch(api.util.invalidateTags(["Order", "ServiceStats", "Table"]));
  });

  socket.on("order_deleted", () => {
    store.dispatch(api.util.invalidateTags(["Order", "ServiceStats", "Table"]));
  });

  socket.on("counter_reset", () => {
    // StoreStatus inclus : ouvrir un service rouvre les commandes en ligne
    // côté backend (voir resetCounter). Sans cette invalidation, l'autre
    // poste continuerait d'afficher l'interrupteur en position fermée.
    store.dispatch(
      api.util.invalidateTags([
        "Order",
        "ServiceStats",
        "Counter",
        "StoreStatus",
      ]),
    );
  });

  // Un poste vient d'ouvrir ou de fermer les commandes en ligne : tous les
  // autres doivent voir l'interrupteur basculer, sinon l'équipe se
  // contredirait au téléphone.
  socket.on("store_status_changed", () => {
    store.dispatch(api.util.invalidateTags(["StoreStatus"]));
  });

  return socket;
}
