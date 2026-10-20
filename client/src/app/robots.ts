import type { MetadataRoute } from "next";
import { DEMO_MODE, SITE_URL } from "@/config/site";
import { LOCALES, localizePath } from "@/i18n/config";

/**
 * Génère /robots.txt au build.
 *
 * En démo, tout est fermé aux robots (en plus du noindex posé par le layout).
 * Hors démo, seules les pages publiques sont ouvertes : le back-office et
 * l'API n'ont rien à faire dans un moteur de recherche.
 */
export default function robots(): MetadataRoute.Robots {
  if (DEMO_MODE) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/login",
        "/dashboard",
        "/commandes",
        "/menu",
        "/historique",
        "/parametres",
        "/promotions",
        "/tables",
        "/utilisateurs",
        "/livraison",
        // Le tunnel de commande, dans les trois langues.
        ...LOCALES.flatMap((locale) => [
          localizePath(locale, "/commande/finaliser"),
          localizePath(locale, "/commande/suivi"),
        ]),
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
