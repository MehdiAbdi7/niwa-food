import { api } from "@/server/api";
import type { ApiEnvelope } from "@/types/api";
import type { CreateTablePayload, RestaurantTable, UpdateTablePayload } from "@/types/table";
import type { Store } from "@/types/store";

export const tableApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTables: builder.query<RestaurantTable[], { store?: Store } | void>({
      query: (params) => ({ url: "/tables", params: params ?? undefined }),
      transformResponse: (response: ApiEnvelope<RestaurantTable[]>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: "Table" as const, id: t._id })),
              { type: "Table" as const, id: "LIST" },
            ]
          : [{ type: "Table" as const, id: "LIST" }],
    }),

    createTable: builder.mutation<RestaurantTable, CreateTablePayload>({
      query: (body) => ({ url: "/tables", method: "POST", body }),
      invalidatesTags: [{ type: "Table", id: "LIST" }],
    }),

    updateTable: builder.mutation<
      RestaurantTable,
      { id: string; body: UpdateTablePayload }
    >({
      query: ({ id, body }) => ({ url: `/tables/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Table", id },
        { type: "Table", id: "LIST" },
      ],
    }),

    // Libération manuelle par le staff (table restée "occupied" hors flux normal)
    freeTable: builder.mutation<RestaurantTable, string>({
      query: (id) => ({ url: `/tables/${id}/free`, method: "PATCH" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Table", id },
        { type: "Table", id: "LIST" },
      ],
    }),

    deleteTable: builder.mutation<null, string>({
      query: (id) => ({ url: `/tables/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Table", id: "LIST" }],
    }),
  }),
});

export const {
  useGetTablesQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useFreeTableMutation,
  useDeleteTableMutation,
} = tableApi;
