import { api } from "@/server/api";
import type { ApiEnvelope } from "@/types/api";
import type { Order } from "@/types/order";

/**
 * Tag dédié aux courses du livreur connecté.
 *
 * Un id explicite plutôt que le tag "Order" nu : les mutations du dashboard
 * invalident "Order" en masse, ce qui n'a aucun sens pour un livreur dont le
 * périmètre tient en trois lignes. Le socket, lui, invalide précisément ce
 * tag-là (voir socketMiddleware).
 */
export const MY_DELIVERIES_TAG = {
  type: "Order" as const,
  id: "MY_DELIVERIES",
};

// Filet si le socket décroche (réseau mobile en mouvement, tunnel, ascenseur).
// 30 s : assez court pour qu'une course annulée disparaisse vite, assez long
// pour ne pas vider la batterie pendant une tournée.
const POLL_INTERVAL_MS = 30_000;

export const deliveryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyDeliveries: builder.query<Order[], void>({
      query: () => "/orders/my-deliveries",
      transformResponse: (response: ApiEnvelope<Order[]>) => response.data,
      providesTags: [MY_DELIVERIES_TAG],
    }),

    /**
     * Confirmation de remise au client.
     *
     * Même effet qu'un clic sur « Marquer livrée » depuis le dashboard : la
     * commande passe en `completed`, son `completedAt` est horodaté à CET
     * instant, et elle part à l'historique. Irréversible — d'où la
     * confirmation côté interface.
     */
    markDelivered: builder.mutation<Order, string>({
      query: (id) => ({ url: `/orders/${id}/delivered`, method: "PATCH" }),
      transformResponse: (response: ApiEnvelope<Order>) => response.data,
      invalidatesTags: [MY_DELIVERIES_TAG],
    }),
  }),
});

export const { useGetMyDeliveriesQuery, useMarkDeliveredMutation } =
  deliveryApi;

export { POLL_INTERVAL_MS as DELIVERIES_POLL_INTERVAL_MS };
