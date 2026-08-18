import { Types } from "mongoose";
import { MenuItem } from "../models/menuItem.js";
import { MenuExtra } from "../models/menuExtra.js";
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

export async function resolveOrderItemsPricing(
  items: CreateOrderInput["items"],
): Promise<IOrderItem[]> {
  const menuItemIds = [...new Set(items.map((item) => item.menuItemId))];
  const extraIds = [
    ...new Set(
      items.flatMap((item) => item.selectedExtras.map((e) => e.extraId)),
    ),
  ];

  const [menuItems, extras] = await Promise.all([
    MenuItem.find({ _id: { $in: menuItemIds } }).populate("category"),
    MenuExtra.find({ _id: { $in: extraIds } }),
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

    // Cherche la variante correspondant au choix du client.
    // Isolé dans un helper car une formule "fixed" court-circuite cette étape.
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
    // Taille servant à résoudre les extras bySize. Une formule qui supprime la
    // variante impose sa propre référence (un mini est facturé comme un M),
    // sinon on retombe sur la taille réellement choisie.
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

      // Chaque choix doit être présent ET faire partie des options prévues,
      // sinon n'importe quelle valeur finirait imprimée sur le ticket cuisine.
      const resolvedChoices = formula.choices.map((choice) => {
        const picked = item.formula!.choices[choice.label];
        if (!picked) {
          throw businessError(
            `Choix "${choice.label}" requis pour la formule ${formula.name}`,
          );
        }
        if (!choice.options.includes(picked)) {
          throw businessError(
            `"${picked}" n'est pas un choix valide pour "${choice.label}"`,
          );
        }
        return picked;
      });

      if (formula.pricingMode === "fixed") {
        // Le prix de la formule remplace celui de la variante : on ne cherche
        // même pas de variante, le produit est servi en format unique.
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

    const selectedExtras = item.selectedExtras.map((selected) => {
      const extra = extraById.get(selected.extraId);
      if (!extra) {
        throw businessError(`Extra introuvable (id: ${selected.extraId})`, 404);
      }
      if (extra.available === false) {
        throw businessError(`Extra "${extra.name}" n'est plus disponible`);
      }

      let price: number;
      if (extra.priceType === "fixed") {
        price = extra.price ?? 0;
      } else {
        if (effectiveSize !== "M" && effectiveSize !== "L") {
          throw businessError(
            `Impossible de déterminer le prix de l'extra "${extra.name}" (taille manquante ou invalide)`,
          );
        }
        price = extra.pricesBySize?.[effectiveSize] ?? 0;
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
