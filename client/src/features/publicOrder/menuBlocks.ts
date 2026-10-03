import type { MenuNavGroup } from "@/features/menu/menuNav";
import type { MenuItem } from "@/types/menuItem";

/**
 * Découpage de la carte en sections lisibles, pour un affichage continu.
 *
 * Pur et sans React : c'est la même logique que la navigation latérale doit
 * suivre pour que ses ancres tombent juste. La partager évite qu'un jour la
 * colonne propose « Signature » alors que la grille ne l'a pas rendu.
 */

/** Un bloc = une sous-section (« Classique », « Sauce rouge »), ou le groupe entier. */
export interface MenuBlock {
  /** Clé stable, identique côté navigation — sert à construire l'ancre DOM. */
  key: string;
  label: string | null;
  items: MenuItem[];
}

export interface MenuSection {
  id: string;
  label: string;
  count: number;
  blocks: MenuBlock[];
}

export interface SpyAnchor {
  id: string;
  group: string;
  subKey: string | null;
}

function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      // Retire les diacritiques : « Chéraga » et « Cheraga » doivent donner la
      // même ancre, et un accent dans un id casse getElementById sur certains
      // navigateurs plus anciens.
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

export function sectionAnchorId(groupLabel: string): string {
  return `carte-${slugify(groupLabel)}`;
}

export function subAnchorId(key: string): string {
  return `carte-sous-${slugify(key)}`;
}

/** Clé d'une sous-section issue d'un découpage par mot-clé (Pizzas). */
export function sectionBlockKey(groupLabel: string, sectionLabel: string) {
  return `${groupLabel}::${sectionLabel}`;
}

function getCategoryId(item: MenuItem): string {
  return typeof item.category === "object" ? item.category._id : item.category;
}

function getBasePrice(item: MenuItem): number {
  return item.variants.length
    ? Math.min(...item.variants.map((variant) => variant.price))
    : Number.POSITIVE_INFINITY;
}

/** Du moins cher au plus cher, puis alphabétique — l'ordre qu'on lit sur une ardoise. */
export function sortMenuItems(items: MenuItem[]): MenuItem[] {
  return [...items].sort(
    (a, b) =>
      getBasePrice(a) - getBasePrice(b) || a.name.localeCompare(b.name, "fr"),
  );
}

export function buildMenuSections(
  nav: MenuNavGroup[],
  items: MenuItem[],
): MenuSection[] {
  const itemById = new Map(items.map((item) => [item._id, item]));
  const placed = new Set<string>();
  const sections: MenuSection[] = [];

  for (const group of nav) {
    const groupItems = items.filter((item) =>
      group.categoryIds.includes(getCategoryId(item)),
    );
    if (groupItems.length === 0) continue;

    groupItems.forEach((item) => placed.add(item._id));

    const blocks: MenuBlock[] = [];

    if (group.subs.length > 0) {
      // Deux catégories fusionnées en un onglet (Burgers = Classique +
      // Signature) : chacune garde son titre.
      for (const sub of group.subs) {
        const subItems = sortMenuItems(
          groupItems.filter((item) => getCategoryId(item) === sub.categoryId),
        );
        if (subItems.length === 0) continue;
        blocks.push({
          key: sub.categoryId,
          label: sub.label,
          items: subItems,
        });
      }
    } else if (group.sections.length > 0) {
      // Découpage par mot-clé de description (Pizzas rouges / blanches).
      const used = new Set<string>();
      for (const section of group.sections) {
        const sectionItems = sortMenuItems(
          section.itemIds
            .map((id) => itemById.get(id))
            .filter((item): item is MenuItem => Boolean(item)),
        );
        if (sectionItems.length === 0) continue;
        sectionItems.forEach((item) => used.add(item._id));
        blocks.push({
          key: sectionBlockKey(group.label, section.label),
          label: section.label,
          items: sectionItems,
        });
      }

      // Un produit dont la description ne correspond à aucun mot-clé ne doit
      // pas disparaître de la carte en silence.
      const rest = sortMenuItems(
        groupItems.filter((item) => !used.has(item._id)),
      );
      if (rest.length > 0) {
        blocks.push({
          key: sectionBlockKey(group.label, "autres"),
          label: blocks.length > 0 ? "Autres" : null,
          items: rest,
        });
      }
    } else {
      blocks.push({ key: group.label, label: null, items: sortMenuItems(groupItems) });
    }

    if (blocks.length === 0) continue;

    sections.push({
      id: sectionAnchorId(group.label),
      label: group.label,
      count: groupItems.length,
      blocks,
    });
  }

  // Filet : un produit dont la catégorie n'apparaît dans aucun groupe de la
  // nav serait invisible. Mieux vaut une section « Autres » qu'un plat en
  // vente nulle part.
  const orphans = sortMenuItems(items.filter((item) => !placed.has(item._id)));
  if (orphans.length > 0) {
    sections.push({
      id: sectionAnchorId("autres"),
      label: "Autres",
      count: orphans.length,
      blocks: [{ key: "autres", label: null, items: orphans }],
    });
  }

  return sections;
}

/**
 * Ancres à surveiller, en ORDRE DOCUMENT.
 *
 * L'ordre compte : le scroll-spy retient la dernière ancre passée sous le
 * seuil, ce qui n'a de sens que si la liste suit la page.
 */
export function buildSpyAnchors(sections: MenuSection[]): SpyAnchor[] {
  const anchors: SpyAnchor[] = [];

  for (const section of sections) {
    anchors.push({ id: section.id, group: section.label, subKey: null });

    for (const block of section.blocks) {
      if (!block.label) continue;
      anchors.push({
        id: subAnchorId(block.key),
        group: section.label,
        subKey: block.key,
      });
    }
  }

  return anchors;
}
