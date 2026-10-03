"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAppDispatch } from "@/lib/hooks";
import { api } from "@/server/api";
import { useGetOrderTrackingQuery } from "./publicOrderApi";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000";

// Filet si le socket ne s'établit pas (proxy d'entreprise, réseau mobile
// capricieux, fallback polling qui traîne). Un client qui attend son burger
// ne doit pas rester bloqué sur un statut périmé.
const POLL_CONNECTED_MS = 60_000;
const POLL_DISCONNECTED_MS = 12_000;

/**
 * Suit une commande en temps réel, pour un visiteur non authentifié.
 *
 * Socket dédié plutôt qu'une extension du socketMiddleware : celui-ci ne
 * s'ouvre que sur sessionLoaded, donc jamais pour un client public, et son
 * cycle de vie est celui de la session. Ici c'est celui d'une page, d'une
 * commande — deux choses sans rapport.
 *
 * Le socket ne transporte pas la commande, seulement un signal : il invalide
 * le tag RTK Query, qui refetche GET /orders/:id/track. Une seule source de
 * vérité, et rien de sensible ne transite par une room ouverte.
 */
export function useOrderTracking(orderId: string) {
  const dispatch = useAppDispatch();
  const [isLive, setIsLive] = useState(false);

  const query = useGetOrderTrackingQuery(orderId, {
    skip: !orderId,
    pollingInterval: isLive ? POLL_CONNECTED_MS : POLL_DISCONNECTED_MS,
  });

  useEffect(() => {
    if (!orderId) return;

    // withCredentials: true est sans effet ici (le visiteur n'a pas de
    // cookie), mais le backend autorise explicitement une connexion sans
    // token — elle n'a simplement pas accès aux rooms "dashboard:*".
    const socket = io(SOCKET_URL, { withCredentials: true });

    const handleUpdate = () => {
      dispatch(api.util.invalidateTags([{ type: "Order", id: orderId }]));
    };

    socket.on("connect", () => {
      setIsLive(true);
      // À poser à CHAQUE connexion, pas seulement à la première : après une
      // coupure réseau, Socket.IO reconnecte avec un nouvel identifiant et
      // les rooms précédentes sont perdues.
      socket.emit("join_order_tracking", orderId);
      // Rattrape ce qui a pu changer pendant la coupure.
      handleUpdate();
    });

    socket.on("disconnect", () => setIsLive(false));
    socket.on("connect_error", () => setIsLive(false));

    socket.on("order_ready", handleUpdate);
    socket.on("order_out_for_delivery", handleUpdate);
    socket.on("order_completed", handleUpdate);
    socket.on("order_cancelled", handleUpdate);
    socket.on("order_updated", handleUpdate);

    return () => {
      socket.disconnect();
    };
  }, [orderId, dispatch]);

  return {
    order: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    // Sert à afficher « en direct » vs « actualisation régulière » : autant
    // être honnête sur ce que le client peut attendre.
    isLive,
  };
}
