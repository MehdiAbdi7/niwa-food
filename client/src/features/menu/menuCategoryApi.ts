import { api } from "@/server/api";
import type { CreateMenuCategoryPayload, MenuCategory } from "@/types/menuItem";

// Le read (getMenuCategories) vit dans menuApi.ts et sert aussi le site public
// — on n'y touche pas. Ce fichier n'ajoute que les mutations, qui invalident
// le même tag "MenuCategory" pour rafraîchir les deux.
export const menuCategoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createMenuCategory: builder.mutation<MenuCategory, CreateMenuCategoryPayload>({
      query: (body) => ({ url: "/menu-categories", method: "POST", body }),
      invalidatesTags: ["MenuCategory"],
    }),

    updateMenuCategory: builder.mutation<
      MenuCategory,
      { id: string; body: Partial<CreateMenuCategoryPayload> }
    >({
      query: ({ id, body }) => ({
        url: `/menu-categories/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["MenuCategory"],
    }),

    deleteMenuCategory: builder.mutation<null, string>({
      query: (id) => ({ url: `/menu-categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["MenuCategory"],
      // Ne bloque PAS côté front si des produits référencent encore cette
      // catégorie — le backend n'a pas de contrainte de cascade (voir audit
      // initial). On laisse l'erreur Mongo éventuelle remonter telle quelle.
    }),
  }),
});

export const {
  useCreateMenuCategoryMutation,
  useUpdateMenuCategoryMutation,
  useDeleteMenuCategoryMutation,
} = menuCategoryApi;
