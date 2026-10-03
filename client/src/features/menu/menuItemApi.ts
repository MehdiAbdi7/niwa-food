import { api } from "@/server/api";
import type { ApiEnvelope } from "@/types/api";
import type { CreateMenuItemPayload, MenuItem } from "@/types/menuItem";

interface UploadImageResult {
  imageUrl: string;
  imagePublicId: string;
}

// Le read (getMenuItems) vit dans menuApi.ts, réutilisé aussi par le site public.
export const menuItemApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createMenuItem: builder.mutation<MenuItem, CreateMenuItemPayload>({
      query: (body) => ({ url: "/menu-items", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<MenuItem>) => response.data,
      invalidatesTags: ["MenuItem"],
    }),

    updateMenuItem: builder.mutation<
      MenuItem,
      { id: string; body: Partial<CreateMenuItemPayload> }
    >({
      query: ({ id, body }) => ({
        url: `/menu-items/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<MenuItem>) => response.data,
      invalidatesTags: ["MenuItem"],
    }),

    deleteMenuItem: builder.mutation<null, string>({
      query: (id) => ({ url: `/menu-items/${id}`, method: "DELETE" }),
      invalidatesTags: ["MenuItem"],
    }),

    // multipart/form-data : fetchBaseQuery détecte un body FormData et laisse
    // le navigateur poser le Content-Type avec sa boundary automatiquement —
    // ne jamais le fixer à la main ici.
    uploadMenuItemImage: builder.mutation<
      UploadImageResult,
      { id: string; file: File }
    >({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("image", file);
        return {
          url: `/upload/menu-item-image/${id}`,
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: ApiEnvelope<UploadImageResult>) =>
        response.data,
      invalidatesTags: ["MenuItem"],
    }),

    deleteMenuItemImage: builder.mutation<null, string>({
      query: (id) => ({
        url: `/upload/menu-item-image/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MenuItem"],
    }),
  }),
});

export const {
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useUploadMenuItemImageMutation,
  useDeleteMenuItemImageMutation,
} = menuItemApi;
