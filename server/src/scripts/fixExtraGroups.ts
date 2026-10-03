import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { MenuItem } from "../models/menuItem.js";
import { MenuCategory } from "../models/menuCategory.js";
import { MenuExtra } from "../models/menuExtra.js";
import { MenuExtraType } from "../models/menuExtraType.js";

/**
 * Recompose les groupes d'extras selon la règle métier réelle.
 *
 * migrateExtraGroups.ts avait repris les MenuExtraType tels quels
 * ("viande", "poisson", "légume"...), ce qui produisait six groupes par pizza
 * et un « Gratinage » sur des produits qui n'en reçoivent pas. Ces types
 * décrivent la NATURE de l'ingrédient, pas la façon dont le client le choisit
 * — deux notions différentes qu'on avait confondues.
 *
 * Règle appliquée :
 *   - catégorie Tacos  -> un groupe "Gratinage" (choix unique) avec les
 *     extras de type Gratinage, plus un groupe "Suppléments" pour le reste
 *   - toute autre catégorie -> un seul groupe "Suppléments", sans le
 *     moindre gratinage
 *
 * Écrase les groupes existants : c'est le but, on repart d'une base saine.
 * La tarification n'est jamais recopiée dans les options — celle du MenuExtra
 * continue de s'appliquer, donc aucun prix ne bouge.
 */

// Catégories dont les produits reçoivent un gratinage. Les autres n'en ont
// jamais, quel que soit le type des extras qu'on leur avait rattachés.
const GRATINAGE_CATEGORY_NAMES = ["Tacos Classique", "Tacos Signature"];

// Nom du MenuExtraType qui désigne réellement un gratinage.
const GRATINAGE_TYPE_NAME = "Gratinage";

async function main() {
  await connectDB();

  const types = await MenuExtraType.find();
  const gratinageTypeId = types
    .find((type) => type.name === GRATINAGE_TYPE_NAME)
    ?._id.toString();

  if (!gratinageTypeId) {
    console.warn(
      `Aucun MenuExtraType nommé "${GRATINAGE_TYPE_NAME}" — aucun groupe Gratinage ne sera créé.`,
    );
  }

  const extras = await MenuExtra.find();
  const isGratinage = new Map(
    extras.map((extra) => [
      extra._id.toString(),
      extra.type.toString() === gratinageTypeId,
    ]),
  );

  const categories = await MenuCategory.find();
  const categoryNameById = new Map(
    categories.map((category) => [category._id.toString(), category.name]),
  );

  const items = await MenuItem.find();
  let updated = 0;

  for (const item of items) {
    const categoryName = categoryNameById.get(item.category.toString()) ?? "";
    const acceptsGratinage = GRATINAGE_CATEGORY_NAMES.includes(categoryName);

    // Les extras déjà rattachés au produit, quel que soit le groupe où la
    // migration précédente les avait rangés. Set : un même extra pouvait se
    // retrouver dans deux groupes.
    const attachedIds = new Set<string>(
      (item.extraGroups ?? []).flatMap((group) =>
        group.options.map((option) => option.extra.toString()),
      ),
    );

    // Repli pour un produit jamais migré.
    if (attachedIds.size === 0) {
      for (const extraId of item.availableExtras ?? []) {
        attachedIds.add(extraId.toString());
      }
    }

    if (attachedIds.size === 0) continue;

    const gratinageIds: string[] = [];
    const supplementIds: string[] = [];

    for (const extraId of attachedIds) {
      // Un gratinage sur une pizza est écarté, pas déplacé : personne ne
      // commande de "gratinage" sur une pizza, l'extra n'y a rien à faire.
      if (isGratinage.get(extraId)) {
        if (acceptsGratinage) gratinageIds.push(extraId);
        continue;
      }
      supplementIds.push(extraId);
    }

    const groups = [];

    if (gratinageIds.length > 0) {
      groups.push({
        label: "Gratinage",
        singleChoice: true,
        options: gratinageIds.map((extra) => ({
          extra: new mongoose.Types.ObjectId(extra),
        })),
      });
    }

    if (supplementIds.length > 0) {
      groups.push({
        label: "Suppléments",
        singleChoice: false,
        options: supplementIds.map((extra) => ({
          extra: new mongoose.Types.ObjectId(extra),
        })),
      });
    }

    item.extraGroups = groups;
    await item.save();
    updated += 1;

    console.log(
      `${item.name} (${categoryName}) -> ${
        groups.map((g) => `${g.label} (${g.options.length})`).join(", ") ||
        "aucun groupe"
      }`,
    );
  }

  console.log(`\nProduits recomposés : ${updated}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Erreur :", err);
  process.exit(1);
});
