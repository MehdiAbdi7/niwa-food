import { NUMBER_LOCALES, type Locale } from "@/i18n/config";

// « DA » en français et en anglais, « دج » en arabe : les deux abréviations
// qu'on lit sur les prix en Algérie.
const CURRENCY: Record<Locale, string> = { fr: "DA", ar: "دج", en: "DA" };

// Dinar algérien : pas de devise Intl standard fiable partout, on formate à la main.
// La langue est facultative : le back-office, en français, ne la passe pas.
export function formatDA(value: number, locale: Locale = "fr"): string {
  return `${value.toLocaleString(NUMBER_LOCALES[locale])} ${CURRENCY[locale]}`;
}

/**
 * Montant abrégé, pour les endroits où la place est comptée.
 *
 * Une case de calendrier fait ~48 px de large sur un téléphone : « 68 000 DA »
 * y déborde ou force une taille de police illisible, « 68k » passe. On ne
 * l'utilise QUE dans ce contexte — un montant tronqué dans un ticket ou un
 * total serait inacceptable.
 */
export function formatCompactDA(value: number): string {
  if (value >= 1_000_000) {
    // Une décimale suffit : à ce niveau, le chiffre sert d'ordre de grandeur.
    return `${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

// hourCycle "h23" : 19:05 dans toutes les langues. Sans lui, l'arabe et
// l'anglais passeraient en 07:05 م / 07:05 PM, peu lu en Algérie.
export function formatTime(iso: string, locale: Locale = "fr"): string {
  return new Date(iso).toLocaleTimeString(NUMBER_LOCALES[locale], {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Jour d'une journée commerciale (`serviceDate`).
 *
 * `timeZone: "UTC"` est OBLIGATOIRE ici, contrairement aux fonctions
 * ci-dessus. `serviceDate` est stockée à minuit UTC : la laisser interpréter
 * dans le fuseau du navigateur afficherait « 28/02 » pour une journée du 1er
 * mars dès que le lecteur est à l'ouest de Greenwich.
 */
export function formatServiceDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
