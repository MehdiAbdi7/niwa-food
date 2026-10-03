import { api } from "@/server/api";
import type { ApiEnvelope } from "@/types/api";
import type { CreateOrderPayload, Order, OrderTracking, OrderType } from "@/types/order";
import type { PromoValidation } from "@/types/promoCode";
import type { PublicTable } from "@/types/table";
import type { Store } from "@/types/store";

/**
 * Endpoints du parcours client, tous publics (aucun CheckAuth côté backend).
 *
 * Volontairement séparé de features/orders/orderApi.ts : celui-ci sert le
 * dashboard, avec une politique d'invalidation dense (Order, ServiceStats,
 * Counter...). Un visiteur du site n'a rien de tout ça en cache, et mélanger
 * les deux ferait invalider des tags que personne n'a demandés.
 */
export const publicOrderApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPublicTables: builder.query<PublicTable[], { store: Store }>({
      query: ({ store }) => ({ url: "/tables/public", params: { store } }),
      transformResponse: (response: ApiEnvelope<PublicTable[]>) =>
        response.data,
      providesTags: [{ type: "Table", id: "PUBLIC" }],
    }),

    createPublicOrder: builder.mutation<Order, CreateOrderPayload>({
      query: (body) => ({ url: "/orders", method: "POST", body }),
      // transformResponse indispensable : le backend enveloppe tout dans
      // { success, message, data }. Sans ça, `created._id` serait undefined
      // et la redirection vers le suivi partirait sur une URL cassée.
      transformResponse: (response: ApiEnvelope<Order>) => response.data,
      // Une commande sur place occupe la table : la liste publique doit le
      // refléter pour le client suivant qui scanne le QR.
      invalidatesTags: [{ type: "Table", id: "PUBLIC" }],
    }),

    /**
     * Retrouve une commande EN COURS par son numéro du jour.
     *
     * Ne renvoie que l'identifiant : le front redirige ensuite vers
     * /commande/suivi/<id>, la page qui existe déjà. Construire une URL du
     * type /suivi/kouba/2 serait une erreur — le numéro est recyclé au service
     * suivant, donc un lien mis en favori pointerait sur la commande de
     * quelqu'un d'autre le lendemain. L'ObjectId, lui, est stable.
     *
     * Volontairement SANS providesTags : c'est une résolution ponctuelle, pas
     * une donnée à garder fraîche. Le suivi lui-même a son propre cache.
     */
    lookupOrder: builder.query<
      { _id: string },
      { store: Store; dailyNumber: number }
    >({
      query: (params) => ({ url: "/orders/lookup", params }),
      transformResponse: (response: ApiEnvelope<{ _id: string }>) =>
        response.data,
    }),

    /**
     * Vérifie un code promo AVANT l'envoi de la commande.
     *
     * Rejouée à chaque changement de panier ou de mode de service : un code
     * réservé à la livraison doit sauter dès que le client bascule sur « à
     * emporter », et un code à partir de 2 000 DA doit sauter s'il retire un
     * article. Sans revalidation, il partirait à l'envoi et se ferait rejeter
     * par le backend, sur un écran où l'erreur est bien moins lisible.
     *
     * SANS providesTags : le résultat dépend du panier de l'instant, le mettre
     * en cache produirait une remise périmée.
     */
    validatePromoCode: builder.query<
      PromoValidation,
      { code: string; itemsTotal: number; orderType: OrderType }
    >({
      query: (params) => ({ url: "/promo-codes/validate", params }),
      transformResponse: (response: ApiEnvelope<PromoValidation>) =>
        response.data,
    }),

    // Tag propre au suivi ("Order" + l'id) : le socket public l'invalide à
    // chaque événement, ce qui déclenche un refetch. Le document ne transite
    // jamais par le socket, seule cette route applique la bonne projection.
    getOrderTracking: builder.query<OrderTracking, string>({
      query: (id) => `/orders/${id}/track`,
      transformResponse: (response: ApiEnvelope<OrderTracking>) =>
        response.data,
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),
  }),
});

export const {
  useGetPublicTablesQuery,
  useCreatePublicOrderMutation,
  useLazyLookupOrderQuery,
  useLazyValidatePromoCodeQuery,
  useGetOrderTrackingQuery,
} = publicOrderApi;
