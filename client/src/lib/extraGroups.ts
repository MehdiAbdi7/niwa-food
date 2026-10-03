import { getExtraTypeName } from "./extraPrice";
import type {
  ExtraPriceType,
  MenuExtra,
  MenuItem,
  MenuItemExtraOption,
} from "@/types/menuItem";

/** Un extra, sa tarification effective résolue pour un produit donné. */
export interface ResolvedExtraOption {
  extra: MenuExtra;
  priceType: ExtraPriceType;
  price?: number;
  pricesBySize?: { M: number; L: number };
}

export interface ResolvedExtraGroup {
  label: string;
  singleChoice: boolean;
  options: ResolvedExtraOption[];
}

/**
 * Prix d'un extra dans le contexte de son produit.
 *
 * Miroir de resolveOrderItemsPricing côté backend, uniquement pour AFFICHER
 * un total juste pendant la saisie — le serveur recalcule tout à la création.
 *
 * `effectiveSize` vient de resolveEffectiveSize() : la taille du variant
 * choisi, ou celle imposée par la formule (un Menu Kids compte comme un M).
 */
export function resolveOptionPrice(
  option: ResolvedExtraOption,
  effectiveSize: string | undefined,
): number {
  if (option.priceType === "fixed") return option.price ?? 0;
  if (effectiveSize === "M" || effectiveSize === "L") {
    return option.pricesBySize?.[effectiveSize] ?? 0;
  }
  return 0;
}

function isSelectable(
  option: ResolvedExtraOption,
  effectiveSize: string | undefined,
): boolean {
  if (option.extra.available === false) return false;
  if (option.priceType === "fixed") return true;
  // Un extra bySize sans taille connue n'a pas de prix : le proposer
  // reviendrait à l'ajouter à 0 DA en silence.
  return effectiveSize === "M" || effectiveSize === "L";
}

function toResolvedOption(
  extra: MenuExtra,
  override?: Pick<MenuItemExtraOption, "priceType" | "price" | "pricesBySize">,
): ResolvedExtraOption {
  // La surcharge du produit prime sur le catalogue : c'est elle qui rend un
  // Gouda facturable au forfait ici et par taille là.
  return {
    extra,
    priceType: override?.priceType ?? extra.priceType,
    price: override?.price ?? extra.price,
    pricesBySize: override?.pricesBySize ?? extra.pricesBySize,
  };
}

/**
 * Groupes d'extras réellement proposables pour ce produit, à cette taille.
 *
 * Repli sur `availableExtras` quand le produit n'a pas encore de groupes :
 * les extras y sont regroupés par MenuExtraType, sans contrainte de choix
 * unique. Ce chemin disparaîtra une fois la migration passée en production.
 */
export function resolveExtraGroups(
  item: MenuItem,
  effectiveSize: string | undefined,
): ResolvedExtraGroup[] {
  const groups: ResolvedExtraGroup[] = [];

  if (item.extraGroups?.length) {
    for (const group of item.extraGroups) {
      const options = group.options
        // populate() peut ne pas avoir eu lieu : un id brut n'a ni nom ni
        // prix, donc rien d'affichable.
        .filter((option) => typeof option.extra === "object")
        .map((option) => toResolvedOption(option.extra as MenuExtra, option))
        .filter((option) => isSelectable(option, effectiveSize));

      if (options.length > 0) {
        groups.push({
          label: group.label,
          singleChoice: group.singleChoice,
          options,
        });
      }
    }

    return groups;
  }

  // ---- Repli : ancien modèle, groupé par type d'extra ----
  const byLabel = new Map<string, ResolvedExtraOption[]>();

  for (const raw of item.availableExtras ?? []) {
    if (typeof raw !== "object") continue;

    const option = toResolvedOption(raw);
    if (!isSelectable(option, effectiveSize)) continue;

    const label = getExtraTypeName(raw);
    const bucket = byLabel.get(label) ?? [];
    bucket.push(option);
    byLabel.set(label, bucket);
  }

  for (const [label, options] of byLabel) {
    groups.push({ label, singleChoice: false, options });
  }

  return groups;
}

/**
 * Le produit propose-t-il au moins un extra ?
 *
 * Testé SANS taille : c'est une question de configuration du produit, pas de
 * l'état courant de la fiche. Un tacos ne doit pas partir directement au
 * panier sous prétexte qu'aucune taille n'est encore choisie.
 */
export function hasExtras(item: MenuItem): boolean {
  if (item.extraGroups?.length) {
    return item.extraGroups.some((group) =>
      group.options.some((option) => typeof option.extra === "object"),
    );
  }

  return (item.availableExtras ?? []).some(
    (extra) => typeof extra === "object",
  );
}

/** Les ids encore proposables, pour purger une sélection devenue caduque. */
export function collectSelectableIds(
  groups: ResolvedExtraGroup[],
): Set<string> {
  const ids = new Set<string>();
  for (const group of groups) {
    for (const option of group.options) ids.add(option.extra._id);
  }
  return ids;
}

/** Index plat : retrouver une option sélectionnée sans reparcourir les groupes. */
export function indexOptionsById(
  groups: ResolvedExtraGroup[],
): Map<string, ResolvedExtraOption> {
  const map = new Map<string, ResolvedExtraOption>();
  for (const group of groups) {
    for (const option of group.options) map.set(option.extra._id, option);
  }
  return map;
}
