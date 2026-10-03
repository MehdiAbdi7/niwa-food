import { api } from "@/server/api";
import type { ApiEnvelope } from "@/types/api";
import type { MenuItem, MenuCategory } from "@/types/menuItem";

export const menuApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMenuItems: builder.query<MenuItem[], void>({
      query: () => "/menu-items",
      transformResponse: (response: ApiEnvelope<MenuItem[]>) => response.data,
      providesTags: ["MenuItem"],
    }),
    getMenuCategories: builder.query<MenuCategory[], void>({
      query: () => "/menu-categories",
      transformResponse: (response: ApiEnvelope<MenuCategory[]>) =>
        response.data,
      providesTags: ["MenuCategory"],
    }),
  }),
});

export const { useGetMenuItemsQuery, useGetMenuCategoriesQuery } = menuApi;
