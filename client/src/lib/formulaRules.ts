import { FORMULAS, type Formula } from "@/config/formulas";
import type { MenuItem } from "@/types/menuItem";

// availableExtras/category sont populés par le backend ; si la catégorie
// arrive sous forme d'ID brut, aucune formule n'est proposée plutôt que de
// deviner — mieux vaut une option manquante qu'un prix faux.
export function getCategoryName(item: MenuItem): string | undefined {
  return typeof item.category === "object" ? item.category.name : undefined;
}

export function getEligibleFormulas(item: MenuItem): Formula[] {
  const categoryName = getCategoryName(item);
  if (!categoryName) return [];
  return FORMULAS.filter((formula) =>
    formula.eligibleCategoryNames.includes(categoryName),
  );
}

// Taille servant à résoudre les extras bySize. DOIT être utilisée à la fois
// pour l'affichage du prix et pour le test de disponibilité — sinon un extra
// s'affiche sélectionnable mais part à 0 DA, ou l'inverse.
export function resolveEffectiveSize(
  formula: Formula | null,
  variantSelected: Record<string, string>,
): string | undefined {
  return formula?.extraSizeReference ?? variantSelected?.taille;
}
