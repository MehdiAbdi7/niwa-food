// Origines autorisées, séparées par des virgules dans CORS_ORIGIN :
//   CORS_ORIGIN=http://localhost:3000,https://niwa-food.vercel.app
// Le défaut vise le port 3000 (Next.js) — l'ancien défaut était 5173 (Vite),
// hérité d'un autre projet, ce qui bloquait le front en local dès que
// CORS_ORIGIN n'était pas défini dans le .env.
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Vercel crée une URL unique par déploiement de preview
// (https://<projet>-<hash>-<team>.vercel.app) : impossible de toutes les
// lister dans CORS_ORIGIN. Activé uniquement si ALLOW_VERCEL_PREVIEWS=true,
// à ne pas laisser actif si le backend sert des données sensibles.
const VERCEL_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;

export function isAllowedOrigin(origin?: string | null): boolean {
  // Pas de header Origin = appel serveur-à-serveur, Postman, curl... : autorisé
  // (CORS ne protège que les requêtes déclenchées depuis un navigateur).
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) return true;

  if (
    process.env.ALLOW_VERCEL_PREVIEWS === "true" &&
    VERCEL_PREVIEW_PATTERN.test(origin)
  ) {
    return true;
  }

  return false;
}

export { allowedOrigins };
