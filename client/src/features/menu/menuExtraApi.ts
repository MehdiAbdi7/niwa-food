import { api } from "@/server/api";
import type { ApiEnvelope } from "@/types/api";
import type { CreateMenuExtraPayload, MenuExtra } from "@/types/menuItem";

export const menuExtraApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMenuExtras: builder.query<MenuExtra[], void>({
      query: () => "/menu-extras",
      transformResponse: (response: ApiEnvelope<MenuExtra[]>) => response.data,
      providesTags: ["MenuExtra"],
    }),

    createMenuExtra: builder.mutation<MenuExtra, CreateMenuExtraPayload>({
      query: (body) => ({ url: "/menu-extras", method: "POST", body }),
      invalidatesTags: ["MenuExtra"],
    }),

    updateMenuExtra: builder.mutation<
      MenuExtra,
      { id: string; body: Partial<CreateMenuExtraPayload> }
    >({
      query: ({ id, body }) => ({ url: `/menu-extras/${id}`, method: "PUT", body }),
      invalidatesTags: ["MenuExtra"],
    }),

    deleteMenuExtra: builder.mutation<null, string>({
      query: (id) => ({ url: `/menu-extras/${id}`, method: "DELETE" }),
      invalidatesTags: ["MenuExtra", "MenuItem"],
    }),
  }),
});

export const {
  useGetMenuExtrasQuery,
  useCreateMenuExtraMutation,
  useUpdateMenuExtraMutation,
  useDeleteMenuExtraMutation,
} = menuExtraApi;
