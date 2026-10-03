// Miroir de src/config/stores.ts côté backend — à garder synchronisé
// si un jour un troisième magasin ouvre.
export const STORES = ["kouba", "cheraga"] as const;
export type Store = (typeof STORES)[number];

export const STORE_LABELS: Record<Store, string> = {
  kouba: "Kouba",
  cheraga: "Chéraga",
};
