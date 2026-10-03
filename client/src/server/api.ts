import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// URL relative, et non NEXT_PUBLIC_API_URL : les appels passent par le rewrite
// déclaré dans next.config.ts, qui les relaie vers le backend. Le navigateur
// ne parle donc qu'au domaine du front, ce qui rend le Set-Cookie du backend
// first-party — seule façon pour proxy.ts et getSession() de le voir, eux qui
// tournent sur le domaine Vercel et non sur celui de l'API.
// Effet de bord bienvenu : tout devient same-origin, donc plus de préflight
// CORS ni de restriction navigateur sur les cookies tiers.
const API_URL = "/api";

// Liste volontairement large : un tag déclaré mais jamais utilisé ne coûte
// rien, alors qu'un tag utilisé sans être déclaré déclenche l'avertissement
// « Tag type X was used, but not specified » et casse silencieusement
// l'invalidation. En cas de doute, mieux vaut en déclarer un de trop.
//
// Si une nouvelle alerte apparaît sur un nom absent d'ici, ajoute-le : le
// message donne toujours le nom exact du tag manquant.
const TAG_TYPES = [
  "User",
  "Order",
  "Counter",
  "ServiceStats",
  "Stats",
  "History",
  "Table",
  "MenuItem",
  "MenuCategory",
  "MenuExtra",
  "MenuExtraType",
  // Ouverture/fermeture des commandes en ligne. Invalidé par la mutation du
  // dashboard ET par l'événement socket "store_status_changed", pour que tous
  // les postes voient l'interrupteur basculer.
  "StoreStatus",
  // Codes promo. La vérification publique (GET /promo-codes/validate) n'y est
  // volontairement PAS rattachée : c'est une résolution ponctuelle, dépendante
  // du panier du moment, qui n'a aucun intérêt à être mise en cache.
  "PromoCode",
] as const;

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    // Le navigateur joint le cookie httpOnly tout seul. Conservé malgré le
    // passage en same-origin : sans cette option, fetch n'enverrait pas le
    // cookie si l'API repassait un jour sur un autre domaine.
    credentials: "include",
  }),
  tagTypes: TAG_TYPES,
  endpoints: () => ({}),
});
