import { NUMBER_LOCALES, type Locale } from "./config";

/**
 * Les formes d'un texte qui dépend d'un nombre.
 *
 * Le français en a deux (1 article, 2 articles), l'arabe six : zéro, un,
 * deux, de 3 à 10, de 11 à 99, et le reste. Seule `other` est obligatoire,
 * c'est la forme de secours.
 */
export type Plural = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string;
};

/**
 * Ne fait rien à l'exécution. Sert seulement à typer une entrée plurielle
 * dans fr.ts : sans lui, TypeScript déduirait `{ one, other }` et refuserait
 * les formes supplémentaires de ar.ts.
 */
export function plural(forms: Plural): Plural {
  return forms;
}

/**
 * Remplace chaque {nom} d'un texte par sa valeur.
 *
 * fill("Table {number}", { number: 4 }) donne "Table 4". Un {nom} sans
 * valeur reste tel quel, ce qui rend l'oubli visible à l'écran.
 */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * Choisit la forme qui convient au nombre, d'après les règles de la langue
 * (Intl.PluralRules), puis remplace {count} et les autres valeurs.
 */
export function pluralize(
  locale: Locale,
  forms: Plural,
  count: number,
  values: Record<string, string | number> = {},
): string {
  const rule = new Intl.PluralRules(NUMBER_LOCALES[locale]).select(count);
  return fill(forms[rule] ?? forms.other, { count, ...values });
}
