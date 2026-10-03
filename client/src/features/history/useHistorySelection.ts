"use client";

import { useCallback, useState } from "react";
import type { HistorySortBy, HistorySortOrder } from "./historyApi";
import type { OrderType } from "@/types/order";

/**
 * Tri exposé à l'utilisateur, encodé sur une seule valeur.
 *
 * Deux <select> séparés (critère + sens) obligeraient à réfléchir à
 * « décroissant » dans l'abstrait. Une seule liste d'intitulés explicites
 * (« Plus récentes », « Montant décroissant ») se lit sans effort, et le hook
 * se charge de la décomposer pour l'API.
 */
export const SORT_OPTIONS = [
  { value: "date:desc", label: "Plus récentes" },
  { value: "date:asc", label: "Plus anciennes" },
  { value: "amount:desc", label: "Montant décroissant" },
  { value: "amount:asc", label: "Montant croissant" },
  { value: "number:asc", label: "N° de commande croissant" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

/**
 * Filtre de type, "all" compris.
 *
 * Un type À PART et non `OrderType | undefined` : côté interface, « Tous » est
 * un choix explicite que l'utilisateur a fait, pas une absence de choix. Le
 * mélanger avec `undefined` rendrait impossible de distinguer « il a cliqué
 * Tous » de « rien n'est encore initialisé ». La conversion vers l'API se fait
 * en un seul endroit, via `apiType` ci-dessous.
 */
export type TypeFilter = OrderType | "all";

export interface HistorySelection {
  type: TypeFilter;
  /** null = pas encore choisi ; la page retombe alors sur l'année la plus récente. */
  year: number | null;
  month: number | null;
  day: number | null;
  search: string;
  sort: SortValue;
  page: number;
}

/**
 * État de navigation de l'historique.
 *
 * Toute la logique de CASCADE vit ici, en un seul endroit : changer de type
 * remet le calendrier à zéro, changer d'année efface le mois et le jour,
 * changer de mois efface le jour. Éparpiller ces resets dans les composants
 * laisserait forcément passer un cas — typiquement un jour sélectionné qui
 * survit à un changement de mois et produit une liste vide inexplicable.
 *
 * Deuxième invariant central : TOUTE modification de la sélection ramène à la
 * page 1. Sans ça, on reste page 7 d'une liste qui n'en compte plus que deux,
 * et l'écran paraît cassé.
 */
export function useHistorySelection() {
  const [selection, setSelection] = useState<HistorySelection>({
    // « Tous » par défaut : à l'ouverture de l'écran, le gérant veut le
    // chiffre d'affaires global, pas celui d'un seul mode de service.
    type: "all",
    year: null,
    month: null,
    day: null,
    search: "",
    sort: "date:desc",
    page: 1,
  });

  const setType = useCallback((type: TypeFilter) => {
    // Un type de commande n'a pas les mêmes années actives qu'un autre :
    // repartir de zéro évite de pointer une période vide pour ce type.
    setSelection((prev) => ({
      ...prev,
      type,
      year: null,
      month: null,
      day: null,
      page: 1,
    }));
  }, []);

  const setYear = useCallback((year: number) => {
    setSelection((prev) => ({ ...prev, year, month: null, day: null, page: 1 }));
  }, []);

  /**
   * Le clic sur un mois est un BASCULE : recliquer sur le mois affiché le
   * désélectionne et remonte à l'année entière. C'est ce qui fait du
   * calendrier un filtre plutôt qu'un chemin sans retour — l'utilisateur n'a
   * pas besoin d'un bouton « revenir à l'année » qu'il faudrait deviner.
   */
  const toggleMonth = useCallback((month: number) => {
    setSelection((prev) => ({
      ...prev,
      month: prev.month === month ? null : month,
      day: null,
      page: 1,
    }));
  }, []);

  const toggleDay = useCallback((day: number) => {
    setSelection((prev) => ({
      ...prev,
      day: prev.day === day ? null : day,
      page: 1,
    }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setSelection((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setSort = useCallback((sort: SortValue) => {
    setSelection((prev) => ({ ...prev, sort, page: 1 }));
  }, []);

  // Seul setter qui NE remet PAS la page à 1, pour des raisons évidentes.
  const setPage = useCallback((page: number) => {
    setSelection((prev) => ({ ...prev, page }));
  }, []);

  const clearSelection = useCallback(() => {
    setSelection((prev) => ({
      ...prev,
      month: null,
      day: null,
      search: "",
      page: 1,
    }));
  }, []);

  // Décomposé ici plutôt que dans le composant : l'API attend deux paramètres
  // distincts, l'interface n'en montre qu'un.
  const [sortBy, sortOrder] = selection.sort.split(":") as [
    HistorySortBy,
    HistorySortOrder,
  ];

  // Traduction unique du sentinel "all" vers ce que l'API attend (clé absente).
  // La faire ici évite de la répéter dans les quatre requêtes de la page — et
  // d'en oublier une, ce qui donnerait un calendrier et une liste incohérents.
  const apiType: OrderType | undefined =
    selection.type === "all" ? undefined : selection.type;

  return {
    selection,
    apiType,
    sortBy,
    sortOrder,
    setType,
    setYear,
    toggleMonth,
    toggleDay,
    setSearch,
    setSort,
    setPage,
    clearSelection,
  };
}
