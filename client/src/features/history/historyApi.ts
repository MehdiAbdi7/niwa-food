import { api } from "@/server/api";
import type { ApiEnvelope } from "@/types/api";
import type {
  HistoryDayEntry,
  HistoryMonthEntry,
  HistoryYearEntry,
  OrderStatus,
  OrderType,
} from "@/types/order";
import type { Store } from "@/types/store";

// `type` est obligatoire côté backend (voir historyBaseSchema) : impossible de
// demander "tous les types" en un seul appel d'historique, il faut choisir.
interface BaseHistoryParams {
  /**
   * Absent = tous les modes de service confondus.
   *
   * La clé est retirée de l'URL quand elle vaut `undefined` (voir `getHistory`
   * plus bas), et le backend la traduit alors en `$in` sur la liste complète —
   * jamais en absence de filtre, pour ne pas casser son index.
   */
  type?: OrderType;
  store?: Store;
}

export type HistorySortBy = "date" | "amount" | "number";
export type HistorySortOrder = "asc" | "desc";

export interface HistoryParams extends BaseHistoryParams {
  year: number;
  /** Absent = toute l'année. */
  month?: number;
  /** Absent = tout le mois. Exige `month`. */
  day?: number;
  search?: string;
  sortBy?: HistorySortBy;
  sortOrder?: HistorySortOrder;
  page?: number;
  limit?: number;
}

/**
 * Ligne de liste, telle que projetée par le backend (HISTORY_LIST_FIELDS).
 *
 * Type DISTINCT de `Order`, et non un `Partial<Order>` : la projection ne
 * renvoie ni `items`, ni `remark`, ni le téléphone du client. Un type à part
 * fait que TypeScript refuse de compiler si quelqu'un tente d'afficher
 * `order.items` dans la liste, au lieu de laisser passer un `undefined` qui
 * planterait à l'exécution.
 */
export interface HistoryListItem {
  _id: string;
  dailyNumber: number;
  status: OrderStatus;
  type: OrderType;
  store: Store;
  client: { fullName: string };
  totalPrice: number;
  completedAt: string | null;
  serviceDate: string;
  createdAt: string;
}

export interface HistorySummary {
  count: number;
  revenue: number;
  averageBasket: number;
}

export interface HistoryPage {
  orders: HistoryListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  /** Porte sur TOUTE la sélection, pas seulement la page affichée. */
  summary: HistorySummary;
}

/**
 * Retire les clés indéfinies ou vides avant l'envoi.
 *
 * Indispensable : sans ce nettoyage, RTK Query sérialise `type=undefined` dans
 * l'URL, et le validateur Zod du backend rejette la chaîne littérale
 * "undefined" — un 400 sur un filtre parfaitement légitime (« Tous »).
 */
function pruneParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export const historyApi = api.injectEndpoints({
  // Chaque endpoint déclare providesTags: Order/LIST — sans ça, supprimer une
  // commande depuis l'historique la retirerait bien de la base mais la ligne
  // resterait affichée jusqu'à un F5 (RTK Query ignore que ces vues dépendent
  // des commandes). La mutation deleteOrder invalide déjà ce tag.
  endpoints: (builder) => ({
    /* ---------- Agrégations : elles peuplent les cases du calendrier ---------- */

    getHistoryYears: builder.query<HistoryYearEntry[], BaseHistoryParams>({
      query: (params) => ({
        url: "/orders/history/years",
        params: pruneParams(params),
      }),
      transformResponse: (response: ApiEnvelope<HistoryYearEntry[]>) =>
        response.data,
      providesTags: [{ type: "Order", id: "LIST" }],
    }),

    getHistoryMonths: builder.query<
      HistoryMonthEntry[],
      BaseHistoryParams & { year: number }
    >({
      query: (params) => ({
        url: "/orders/history/months",
        params: pruneParams(params),
      }),
      transformResponse: (response: ApiEnvelope<HistoryMonthEntry[]>) =>
        response.data,
      providesTags: [{ type: "Order", id: "LIST" }],
    }),

    getHistoryDays: builder.query<
      HistoryDayEntry[],
      BaseHistoryParams & { year: number; month: number }
    >({
      query: (params) => ({
        url: "/orders/history/days",
        params: pruneParams(params),
      }),
      transformResponse: (response: ApiEnvelope<HistoryDayEntry[]>) =>
        response.data,
      providesTags: [{ type: "Order", id: "LIST" }],
    }),

    /* ---------- Liste unifiée ---------- */

    /**
     * Un seul endpoint pour les trois niveaux : le backend déduit la plage de
     * dates des paramètres présents. Les clés `undefined` sont retirées avant
     * l'envoi — sans ça, RTK Query sérialiserait `month=undefined` dans l'URL
     * et le validateur Zod rejetterait la chaîne "undefined".
     */
    getHistory: builder.query<HistoryPage, HistoryParams>({
      query: (params) => ({
        url: "/orders/history",
        params: pruneParams(params),
      }),
      transformResponse: (response: ApiEnvelope<HistoryPage>) => response.data,
      providesTags: [{ type: "Order", id: "LIST" }],
    }),
  }),
});

export const {
  useGetHistoryYearsQuery,
  useGetHistoryMonthsQuery,
  useGetHistoryDaysQuery,
  useGetHistoryQuery,
} = historyApi;
