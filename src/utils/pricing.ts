import { Types } from "mongoose";
import { MenuItem } from "../models/menuItem.js";
import { MenuExtra } from "../models/menuExtra.js";
import {
  KIDS_MENU_PRICE,
  KIDS_MENU_ALLOWED_CATEGORIES,
} from "../config/constants.js";
import { IOrderItem } from "../types/models/order.js";
import { CreateOrderInput } from "../validation/order.js";

function businessError(message: string, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

// Compare deux combinations de variante (ex: { taille: "M", viande: "poulet" })
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

    const variant = menuItem.variants.find((v) =>
      combinationsMatch(
        v.combination as Record<string, string>,
        item.variantSelected,
      ),
    );
    if (!variant) {
      throw businessError(`Variante invalide pour "${menuItem.name}"`);
    }

    let unitPrice = variant.price;

    // Menu Kids : prix serveur forcé, après vérification de la catégorie autorisée
    if (item.isKidsMenu) {
      const categoryName = (menuItem.category as any)?.name as
        | string
        | undefined;
      if (
        !categoryName ||
        !KIDS_MENU_ALLOWED_CATEGORIES.includes(categoryName)
      ) {
        throw businessError(
          `"${menuItem.name}" n'est pas éligible au Menu Kids (catégorie non autorisée)`,
        );
      }
      unitPrice = KIDS_MENU_PRICE;
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
        // bySize : on va chercher la taille dans le variant choisi par le client
        const size = item.variantSelected.taille;
        if (size !== "M" && size !== "L") {
          throw businessError(
            `Impossible de déterminer le prix de l'extra "${extra.name}" (taille manquante ou invalide)`,
          );
        }
        price = extra.pricesBySize?.[size] ?? 0;
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
      variantSelected: item.variantSelected,
      unitPrice,
      selectedExtras,
      excludedIngredients: item.excludedIngredients,
      quantity: item.quantity,
      isKidsMenu: item.isKidsMenu,
    };
  });
}
