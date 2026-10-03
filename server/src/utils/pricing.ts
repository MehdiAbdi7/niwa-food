import { Types } from "mongoose";
import { MenuItem } from "../models/menuItem.js";
import { MenuExtra } from "../models/menuExtra.js";
import { MenuCategory } from "../models/menuCategory.js";
import { FORMULA_BY_ID, isFormulaEligible } from "../config/formulas.js";
import { IOrderFormula, IOrderItem } from "../types/models/order.js";
import { CreateOrderInput } from "../validation/order.js";

function businessError(message: string, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function combinationsMatch(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
}

// Noms de catégories dont on aura besoin pour valider les choix de formule.
// Calculé AVANT toute requête : le .map principal est synchrone, il ne peut
// pas aller chercher les options au coup par coup.
function collectChoiceCategoryNames(
  items: CreateOrderInput["items"],
): Set<string> {
  const names = new Set<string>();

  for (const item of items) {
    if (!item.formula) continue;

    const formula = FORMULA_BY_ID.get(item.formula.formulaId);
    if (!formula) continue; // formule inconnue -> rejetée plus bas, message précis

    for (const choice of formula.choices) {
      names.add(choice.fromCategoryName);
    }
  }

  return names;
}

// Options réellement commandables, par nom de catégorie.
async function loadChoiceOptions(
  categoryNames: Set<string>,
): Promise<Map<string, Set<string>>> {
  const optionsByCategory = new Map<string, Set<string>>();
  if (categoryNames.size === 0) return optionsByCategory;

  const categories = await MenuCategory.find({
    name: { $in: [...categoryNames] },
  });
  if (categories.length === 0) return optionsByCategory;

  const drinkItems = await MenuItem.find({
    category: { $in: categories.map((category) => category._id) },
    available: true,
  }).select("name category");

  const categoryNameById = new Map(
    categories.map((category) => [category._id.toString(), category.name]),
  );

  for (const category of categories) {
    optionsByCategory.set(category.name, new Set());
  }

  for (const drink of drinkItems) {
    const name = categoryNameById.get(drink.category.toString());
    if (name) optionsByCategory.get(name)!.add(drink.name);
  }

  return optionsByCategory;
}

/** Tarification d'un extra dans le contexte d'un produit donné. */
interface ExtraContext {
  groupLabel: string;
  singleChoice: boolean;
  priceType?: "fixed" | "bySize";
  price?: number;
  pricesBySize?: { M: number; L: number };
}

/**
 * Index des extras que CE produit autorise, avec leur tarification locale.
 *
 * Deux rôles, et le premier est une correction de sécurité : jusqu'ici aucune
 * vérification n'était faite entre l'extra demandé et le produit. Un client
 * pouvait joindre n'importe quel extraId à n'importe quel article — un
 * gratinage sur une canette, par exemple. `availableExtras` était déclaré sur
 * le modèle mais n'était lu nulle part côté serveur.
 *
 * Le repli sur availableExtras couvre les produits pas encore migrés : le
 * groupe y est alors nommé "Suppléments", sans contrainte de choix unique.
 */
function buildExtraContext(menuItem: {
  extraGroups?: { label: string; singleChoice: boolean; options: any[] }[];
  availableExtras?: Types.ObjectId[];
}): Map<string, ExtraContext> {
  const context = new Map<string, ExtraContext>();

  const groups = menuItem.extraGroups ?? [];

  if (groups.length > 0) {
    for (const group of groups) {
      for (const option of group.options) {
        context.set(option.extra.toString(), {
          groupLabel: group.label,
          singleChoice: group.singleChoice,
          ...(option.priceType ? { priceType: option.priceType } : {}),
          ...(option.price !== undefined ? { price: option.price } : {}),
          ...(option.pricesBySize ? { pricesBySize: option.pricesBySize } : {}),
        });
      }
    }
    return context;
  }

  for (const extraId of menuItem.availableExtras ?? []) {
    context.set(extraId.toString(), {
      groupLabel: "Suppléments",
      singleChoice: false,
    });
  }

  return context;
}

export async function resolveOrderItemsPricing(
  items: CreateOrderInput["items"],
): Promise<IOrderItem[]> {
  const menuItemIds = [...new Set(items.map((item) => item.menuItemId))];
  const extraIds = [
    ...new Set(
      items.flatMap((item) => item.selectedExtras.map((e) => e.extraId)),
    ),
  ];

  const [menuItems, extras, choiceOptions] = await Promise.all([
    MenuItem.find({ _id: { $in: menuItemIds } }).populate("category"),
    MenuExtra.find({ _id: { $in: extraIds } }),
    loadChoiceOptions(collectChoiceCategoryNames(items)),
  ]);

  const menuItemById = new Map(menuItems.map((mi) => [mi._id.toString(), mi]));
  const extraById = new Map(extras.map((ex) => [ex._id.toString(), ex]));

  return items.map((item) => {
    const menuItem = menuItemById.get(item.menuItemId);
    if (!menuItem) {
      throw businessError(`Produit introuvable (id: ${item.menuItemId})`, 404);
    }

    if (menuItem.available === false) {
      throw businessError(`"${menuItem.name}" n'est plus disponible`);
    }

    const categoryName = (menuItem.category as any)?.name as string | undefined;

    const findVariant = () => {
      const variant = menuItem.variants.find((v) =>
        combinationsMatch(
          v.combination as Record<string, string>,
          item.variantSelected,
        ),
      );
      if (!variant) {
        throw businessError(`Variante invalide pour "${menuItem.name}"`);
      }
      return variant;
    };

    let unitPrice: number;
    let variantSelected: Record<string, string> = item.variantSelected;
    let formulaSnapshot: IOrderFormula | undefined;
    let effectiveSize: string | undefined = item.variantSelected.taille;

    if (item.formula) {
      const formula = FORMULA_BY_ID.get(item.formula.formulaId);
      if (!formula) {
        throw businessError(`Formule inconnue (${item.formula.formulaId})`);
      }

      if (!isFormulaEligible(formula, categoryName)) {
        throw businessError(
          `"${menuItem.name}" n'est pas éligible à la formule ${formula.name}`,
        );
      }

      const resolvedChoices = formula.choices.map((choice) => {
        const picked = item.formula!.choices[choice.label];
        if (!picked) {
          throw businessError(
            `Choix "${choice.label}" requis pour la formule ${formula.name}`,
          );
        }

        const options = choiceOptions.get(choice.fromCategoryName);

        if (!options || options.size === 0) {
          throw businessError(
            `Aucune option disponible pour "${choice.label}" (catégorie ${choice.fromCategoryName})`,
          );
        }

        if (!options.has(picked)) {
          throw businessError(
            `"${picked}" n'est pas un choix valide pour "${choice.label}"`,
          );
        }

        return picked;
      });

      if (formula.pricingMode === "fixed") {
        unitPrice = formula.price;
        variantSelected = {};
      } else {
        unitPrice = findVariant().price + formula.price;
      }

      if (formula.extraSizeReference) {
        effectiveSize = formula.extraSizeReference;
      }

      formulaSnapshot = {
        formulaId: formula.id,
        name: formula.name,
        price: formula.price,
        pricingMode: formula.pricingMode,
        includes: [...formula.includedNames, ...resolvedChoices],
      };
    } else {
      unitPrice = findVariant().price;
    }

    const extraContext = buildExtraContext(menuItem);
    // Compte par groupe à choix unique : le front l'empêche déjà, mais le
    // backend ne doit jamais faire confiance au front.
    const pickedBySingleChoiceGroup = new Map<string, string>();

    const selectedExtras = item.selectedExtras.map((selected) => {
      const extra = extraById.get(selected.extraId);
      if (!extra) {
        throw businessError(`Extra introuvable (id: ${selected.extraId})`, 404);
      }
      if (extra.available === false) {
        throw businessError(`Extra "${extra.name}" n'est plus disponible`);
      }

      const context = extraContext.get(selected.extraId);
      if (!context) {
        throw businessError(
          `L'extra "${extra.name}" n'est pas proposé sur "${menuItem.name}"`,
        );
      }

      if (context.singleChoice) {
        const already = pickedBySingleChoiceGroup.get(context.groupLabel);
        if (already) {
          throw businessError(
            `Un seul choix possible pour "${context.groupLabel}" sur "${menuItem.name}" (${already} déjà sélectionné)`,
          );
        }
        pickedBySingleChoiceGroup.set(context.groupLabel, extra.name);
      }

      // La surcharge du produit prime sur le catalogue : c'est elle qui rend
      // un Gouda facturable au forfait ici et par taille là.
      const priceType = context.priceType ?? extra.priceType;
      const fixedPrice = context.price ?? extra.price;
      const sizePrices = context.pricesBySize ?? extra.pricesBySize;

      let price: number;
      if (priceType === "fixed") {
        price = fixedPrice ?? 0;
      } else {
        if (effectiveSize !== "M" && effectiveSize !== "L") {
          throw businessError(
            `Impossible de déterminer le prix de l'extra "${extra.name}" (taille manquante ou invalide)`,
          );
        }
        price = sizePrices?.[effectiveSize] ?? 0;
      }

      return {
        extraId: new Types.ObjectId(selected.extraId),
        name: extra.name,
        price,
      };
    });

    return {
      menuItemId: new Types.ObjectId(item.menuItemId),
      name: menuItem.name,
      variantSelected,
      unitPrice,
      selectedExtras,
      excludedIngredients: item.excludedIngredients,
      quantity: item.quantity,
      ...(formulaSnapshot ? { formula: formulaSnapshot } : {}),
    };
  });
}
