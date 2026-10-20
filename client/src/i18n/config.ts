/**
 * Langues du site public.
 *
 * Le français est la langue par défaut : ses adresses restent SANS préfixe
 * (/commande), celles des autres langues en portent un (/ar/commande,
 * /en/commande). Les liens déjà partagés, le portfolio et les QR codes
 * continuent donc de marcher tels quels, sans redirection.
 *
 * Ce fichier n'importe rien : il est lu par proxy.ts, par les composants
 * serveur et par les composants client.
 */
export const LOCALES = ["fr", "ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

// Chaque langue écrite dans sa propre langue : c'est sous ce nom qu'un
// visiteur la reconnaît dans le sélecteur, quelle que soit la page affichée.
export const LOCALE_NAMES: Record<Locale, string> = {
  fr: "Français",
  ar: "العربية",
  en: "English",
};

// Pour toLocaleString et Intl. "ar-DZ" et non "ar" : en Algérie, les
// chiffres restent latins (1.200 et non ١٬٢٠٠).
export const NUMBER_LOCALES: Record<Locale, string> = {
  fr: "fr-FR",
  ar: "ar-DZ",
  en: "en-US",
};

/** Vrai si la valeur est une langue du site : sert à valider un [lang] d'URL. */
export function hasLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Sens de lecture, posé sur <html dir>. L'arabe se lit de droite à gauche. */
export function getDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/**
 * Adresse d'une page dans une langue : "/commande" devient "/ar/commande".
 * En français, elle ne change pas.
 */
export function localizePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  // "/" devient "/ar" et non "/ar/", "/#contact" devient "/ar#contact".
  if (path === "/") return `/${locale}`;
  if (path.startsWith("/#")) return `/${locale}${path.slice(1)}`;
  return `/${locale}${path}`;
}

/**
 * L'inverse : "/ar/commande" devient "/commande".
 *
 * Retire aussi "/fr" : une page française est rendue sous /fr/... côté
 * serveur (voir proxy.ts), mais affichée sans préfixe dans le navigateur.
 * Comparer des adresses sans leur langue donne donc le même résultat des
 * deux côtés, sans erreur d'hydratation.
 */
export function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  if (!hasLocale(first)) return pathname;
  return `/${rest.join("/")}`;
}
