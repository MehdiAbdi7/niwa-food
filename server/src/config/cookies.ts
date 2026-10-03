import type { CookieOptions } from "express";

export const AUTH_COOKIE_NAME = "niwa_token";

const isProduction = process.env.NODE_ENV === "production";

// Domaine explicite, uniquement utile si le front et l'API partagent un domaine
// parent (ex: COOKIE_DOMAIN=.niwafood.com pour niwafood.com + api.niwafood.com).
// Indispensable au rendu serveur : sans domaine commun, le cookie appartient au
// seul domaine de l'API, et Next ne peut ni le lire dans un Server Component
// ni le voir dans le middleware. Voir MIGRATION.md, section « Déploiement ».
const cookieDomain = process.env.COOKIE_DOMAIN;

// Convertit la durée du JWT ("7d", "24h", "30m") en millisecondes, pour que le
// cookie expire exactement en même temps que le token qu'il transporte. Sans
// ça, un cookie encore valide porterait un JWT expiré : l'utilisateur paraît
// connecté puis se prend un 401 au premier appel, sans comprendre pourquoi.
function parseDurationToMs(duration: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(duration.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return Number(match[1]) * multipliers[match[2]!]!;
}

// Options partagées par la pose ET la suppression du cookie. clearCookie() ne
// retire un cookie que si domain/path/sameSite/secure correspondent exactement
// à ceux de la pose — d'où cette base commune plutôt que deux objets recopiés.
const baseOptions: CookieOptions = {
  httpOnly: true, // invisible pour document.cookie, donc hors de portée d'une XSS
  // sameSite:"none" est obligatoire dès que le front et l'API sont sur deux
  // sites différents (Vercel <-> Render), et les navigateurs le refusent sans
  // secure:true. En local, localhost:3000 -> localhost:5000 reste same-site
  // (le port ne compte pas), donc "lax" suffit et évite d'imposer HTTPS.
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  path: "/",
  ...(cookieDomain ? { domain: cookieDomain } : {}),
};

export const authCookieOptions: CookieOptions = {
  ...baseOptions,
  maxAge: parseDurationToMs(process.env.JWT_EXPIRES_IN || "7d"),
};

export const clearAuthCookieOptions: CookieOptions = baseOptions;
