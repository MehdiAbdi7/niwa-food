import { CATEGORY_GROUPS } from "./categoryGroups";
import type { MenuCategory, MenuItem } from "@/types/menuItem";

export interface MenuNavSub {
  label: string;
  categoryId: string;
  count: number;
}

export interface MenuNavSection {
  label: string;
  itemIds: string[];
  count: number;
}

export interface MenuNavGroup {
  label: string;
  categoryIds: string[];
  count: number;
  subs: MenuNavSub[]; // vide si le groupe ne fusionne qu'une catégorie
  sections: MenuNavSection[];
}

function getCategoryId(item: MenuItem): string {
  return typeof item.category === "object" ? item.category._id : item.category;
}

/**
 * Version SÉRIALISABLE de useCategoryGroups, calculable côté serveur.
 *
 * useCategoryGroups renvoie des sections à prédicat (`test: (item) => boolean`)
 * pour les Pizzas : une fonction ne franchit pas la frontière serveur→client.
 * La carte publique n'utilise que les sous-catégories réelles, donc on ne
 * retient que celles-là et on obtient un objet JSON pur, transmissible en prop.
 *
 * Même source de vérité (CATEGORY_GROUPS) que le dashboard : un groupe déclaré
 * une fois se répercute partout.
 */
export function buildMenuNav(
  categories: MenuCategory[],
  items: MenuItem[],
): MenuNavGroup[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const id = getCategoryId(item);
    counts[id] = (counts[id] ?? 0) + 1;
  }

  const active = categories.filter((category) => category.isActive);
  const used = new Set<string>();
  const groups: MenuNavGroup[] = [];

  for (const config of CATEGORY_GROUPS) {
    // On suit l'ordre des noms de la config, pas celui de la base : "Classique"
    // doit précéder "Signature", c'est une décision éditoriale.
    const matching = config.categoryNames
      .map((name) => active.find((category) => category.name === name))
      .filter((category): category is MenuCategory => Boolean(category));

    if (matching.length === 0) continue;
    matching.forEach((category) => used.add(category._id));

    groups.push({
      label: config.label,
      categoryIds: matching.map((category) => category._id),
      count: matching.reduce((sum, c) => sum + (counts[c._id] ?? 0), 0),
      subs:
        matching.length > 1
          ? matching.map((category) => ({
              label:
                config.subLabels?.find(
                  (sl) => sl.categoryName === category.name,
                )?.displayLabel ?? category.name,
              categoryId: category._id,
              count: counts[category._id] ?? 0,
            }))
          : [],
      sections: (config.sections ?? [])
        .map((section) => {
          const sectionItems = items.filter(
            (item) =>
              matching.some(
                (category) => category._id === getCategoryId(item),
              ) && section.test(item),
          );
          return {
            label: section.label,
            itemIds: sectionItems.map((item) => item._id),
            count: sectionItems.length,
          };
        })
        .filter((section) => section.count > 0),
    });
  }

  // Catégories hors config : un onglet chacune, dans leur ordre backend.
  for (const category of [...active].sort((a, b) => a.order - b.order)) {
    if (used.has(category._id)) continue;
    groups.push({
      label: category.name,
      categoryIds: [category._id],
      count: counts[category._id] ?? 0,
      subs: [],
      sections: [],
    });
  }

  // Un onglet vide est un cul-de-sac : on ne le propose pas.
  return groups.filter((group) => group.count > 0);
}
