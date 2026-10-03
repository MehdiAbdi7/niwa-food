import type { MenuItemVariant } from "@/types/menuItem";

export function formatVariantLabel(
  combination: Record<string, string> | null | undefined,
): string {
  // Défensif : certaines commandes en base (tests Postman antérieurs au
  // dashboard, données saisies hors flux normal) peuvent avoir ce champ à
  // null/undefined malgré le default:{} du schéma Mongoose, qui ne s'applique
  // qu'à la création — jamais de plantage sur de la donnée existante imparfaite.
  if (!combination) return "Standard";
  const entries = Object.entries(combination);
  if (entries.length === 0) return "Standard";
  return entries.map(([, value]) => value).join(" · ");
}

export interface VariantSummary {
  attribute: string;
  values: string[];
}

/**
 * Décrit les AXES DE CHOIX d'un produit, pas ses combinaisons.
 *
 * Un tacos à 3 viandes × 2 tailles a six variantes, mais seulement deux
 * décisions à prendre. Les énumérer une à une — ce que produit un
 * `variants.map(formatVariantLabel).join(" · ")` — donne
 * « poulet · M · poulet · L · viande · M · viande · L », cinq lignes de bruit
 * qui repoussent le prix hors de vue.
 *
 * Un attribut à valeur unique est écarté : ce n'est pas un choix offert au
 * client, c'est une propriété fixe du produit.
 */
export function summarizeVariants(
  variants: MenuItemVariant[],
): VariantSummary[] {
  const groups = new Map<string, string[]>();

  for (const variant of variants) {
    for (const [attribute, value] of Object.entries(
      variant.combination ?? {},
    )) {
      const values = groups.get(attribute) ?? [];
      if (!values.includes(value)) values.push(value);
      groups.set(attribute, values);
    }
  }

  return [...groups.entries()]
    .filter(([, values]) => values.length > 1)
    .map(([attribute, values]) => ({ attribute, values }));
}
