import type { Locale } from "./config";
import { ar } from "./dictionaries/ar";
import { en } from "./dictionaries/en";
import { fr, type Dictionary } from "./dictionaries/fr";

const DICTIONARIES: Record<Locale, Dictionary> = { fr, ar, en };

/**
 * Les textes d'une langue, à appeler côté SERVEUR uniquement (layouts,
 * pages, composants serveur).
 *
 * Importé dans un composant client, ce fichier ferait partir les trois
 * langues dans le JavaScript du navigateur. Les composants client passent
 * par useI18n(), qui ne reçoit que la langue de la page.
 */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
