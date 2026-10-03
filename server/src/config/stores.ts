export const STORES = ["kouba", "cheraga"] as const;
export type Store = (typeof STORES)[number];
