import { api } from "@/server/api";
import type { ApiEnvelope } from "@/types/api";
import type { StoreStatus, UpdateStoreStatusPayload } from "@/types/storeStatus";

/**
 * Ouverture/fermeture des commandes en ligne, par magasin.
 *
 * La lecture est PUBLIQUE et sert deux publics très différents : la carte
 * client (pour prévenir avant qu'on ne compose un panier) et le dashboard
 * (pour piloter l'interrupteur). Un seul endpoint pour les deux — c'est la
 * même donnée, et la dédoublonner créerait deux caches à invalider.
 *
 * Volontairement PAS chargé côté serveur dans la page /commande : celle-ci a
 * un `revalidate = 60`, donc un statut figé dans le HTML pourrait annoncer
 * « ouvert » jusqu'à une minute après la fermeture. Ici la donnée est fraîche
 * à chaque montage, et rafraîchie par le socket côté dashboard.
 */
export const storeStatusApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStoreStatuses: builder.query<StoreStatus[], void>({
      query: () => "/stores/status",
      transformResponse: (response: ApiEnvelope<StoreStatus[]>) =>
        response.data,
      providesTags: ["StoreStatus"],
    }),

    updateStoreStatus: builder.mutation<StoreStatus, UpdateStoreStatusPayload>({
      query: (body) => ({ url: "/stores/status", method: "PATCH", body }),
      transformResponse: (response: ApiEnvelope<StoreStatus>) => response.data,
      invalidatesTags: ["StoreStatus"],
    }),
  }),
});

export const { useGetStoreStatusesQuery, useUpdateStoreStatusMutation } =
  storeStatusApi;
