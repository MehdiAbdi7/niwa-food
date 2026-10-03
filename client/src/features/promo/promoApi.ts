import { api } from "@/server/api";
import type { ApiEnvelope } from "@/types/api";
import type {
  CreatePromoCodePayload,
  PromoCode,
  UpdatePromoCodePayload,
} from "@/types/promoCode";

/**
 * Administration des codes promo.
 *
 * La VÉRIFICATION publique n'est pas ici mais dans publicOrderApi : elle fait
 * partie du parcours client, elle n'est pas authentifiée, et elle n'a aucun
 * tag de cache — mélanger les deux ferait invalider une liste que le visiteur
 * du site n'a jamais chargée.
 */
export const promoApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPromoCodes: builder.query<PromoCode[], void>({
      query: () => "/promo-codes",
      transformResponse: (response: ApiEnvelope<PromoCode[]>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((promo) => ({
                type: "PromoCode" as const,
                id: promo._id,
              })),
              { type: "PromoCode" as const, id: "LIST" },
            ]
          : [{ type: "PromoCode" as const, id: "LIST" }],
    }),

    createPromoCode: builder.mutation<PromoCode, CreatePromoCodePayload>({
      query: (body) => ({ url: "/promo-codes", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<PromoCode>) => response.data,
      invalidatesTags: [{ type: "PromoCode", id: "LIST" }],
    }),

    updatePromoCode: builder.mutation<
      PromoCode,
      { id: string; body: UpdatePromoCodePayload }
    >({
      query: ({ id, body }) => ({
        url: `/promo-codes/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<PromoCode>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "PromoCode", id },
        { type: "PromoCode", id: "LIST" },
      ],
    }),

    deletePromoCode: builder.mutation<null, string>({
      query: (id) => ({ url: `/promo-codes/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "PromoCode", id: "LIST" }],
    }),
  }),
});

export const {
  useGetPromoCodesQuery,
  useCreatePromoCodeMutation,
  useUpdatePromoCodeMutation,
  useDeletePromoCodeMutation,
} = promoApi;
