import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

/**
 * Génère /sitemap.xml au build : la liste des pages que Google doit connaître.
 *
 * Seules les pages publiques et stables y figurent. Le tunnel de commande
 * (finaliser, suivi) n'a aucun intérêt dans un résultat de recherche.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/commande`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/a-propos`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.6 },
  ];
}
