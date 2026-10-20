import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { LOCALES, localizePath } from "@/i18n/config";

// Seules les pages publiques et stables y figurent. Le tunnel de commande
// (finaliser, suivi) n'a aucun intérêt dans un résultat de recherche.
const PAGES: {
  path: string;
  changeFrequency: "monthly" | "weekly" | "yearly";
  priority: number;
}[] = [
  { path: "/", changeFrequency: "monthly", priority: 1 },
  { path: "/commande", changeFrequency: "weekly", priority: 0.9 },
  { path: "/a-propos", changeFrequency: "yearly", priority: 0.5 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
];

/**
 * Génère /sitemap.xml au build : la liste des pages que Google doit connaître.
 *
 * Une entrée par page et par langue. `alternates.languages` dit à Google que
 * /contact, /ar/contact et /en/contact sont la même page en trois langues :
 * il montre alors à chacun la version de sa langue, au lieu de les traiter
 * comme trois pages en concurrence.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((page) => {
    const languages = Object.fromEntries(
      LOCALES.map((locale) => [
        locale,
        `${SITE_URL}${localizePath(locale, page.path)}`,
      ]),
    );

    return LOCALES.map((locale) => ({
      url: `${SITE_URL}${localizePath(locale, page.path)}`,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages },
    }));
  });
}
