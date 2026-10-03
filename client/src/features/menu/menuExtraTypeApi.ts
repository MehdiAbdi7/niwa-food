import { api } from "@/server/api";
import type { ApiEnvelope } from "@/types/api";
import type { MenuExtraType } from "@/types/menuItem";

interface ExtraTypePayload {
  name: string;
}

export const menuExtraTypeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMenuExtraTypes: builder.query<MenuExtraType[], void>({
      query: () => "/menu-extra-types",
      transformResponse: (response: ApiEnvelope<MenuExtraType[]>) => response.data,
      providesTags: ["MenuExtraType"],
    }),

    createMenuExtraType: builder.mutation<MenuExtraType, ExtraTypePayload>({
      query: (body) => ({ url: "/menu-extra-types", method: "POST", body }),
      invalidatesTags: ["MenuExtraType"],
    }),

    updateMenuExtraType: builder.mutation<
      MenuExtraType,
      { id: string; body: ExtraTypePayload }
    >({
      query: ({ id, body }) => ({
        url: `/menu-extra-types/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["MenuExtraType"],
    }),

    deleteMenuExtraType: builder.mutation<null, string>({
      query: (id) => ({ url: `/menu-extra-types/${id}`, method: "DELETE" }),
      invalidatesTags: ["MenuExtraType", "MenuExtra"],
    }),
  }),
});

export const {
  useGetMenuExtraTypesQuery,
  useCreateMenuExtraTypeMutation,
  useUpdateMenuExtraTypeMutation,
  useDeleteMenuExtraTypeMutation,
} = menuExtraTypeApi;
