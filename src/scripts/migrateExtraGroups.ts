import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { MenuItem } from "../models/menuItem.js";
import { MenuExtra } from "../models/menuExtra.js";
import { MenuExtraType } from "../models/menuExtraType.js";

// Types dont un produit ne peut recevoir qu'une seule valeur. C'était une
// constante du FRONT (SINGLE_CHOICE_TYPES), donc invisible côté serveur et
// donc jamais appliquée réellement. Elle ne sert plus qu'ici, à deviner la
// valeur initiale de `singleChoice` — ensuite, c'est le produit qui décide.
const SINGLE_CHOICE_TYPE_NAMES = ["Gratinage"];

/**
 * Convertit `availableExtras` (liste plate) en `extraGroups`, en regroupant
 * par MenuExtraType — c'est-à-dire en reconstituant l'intention d'origine,
 * cette fois portée par le produit et non par l'ingrédient.
 *
 * Idempotent : un produit ayant déjà des groupes est ignoré, le script peut
 * être relancé sans risque.
 *
 * La tarification n'est PAS recopiée dans les options : sans surcharge, celle
 * du MenuExtra continue de s'appliquer, donc aucun prix ne change. La
 * déduplication des doublons (un seul Gouda) se fait ensuite à la main depuis
 * le dashboard, produit par produit.
 */
async function main() {
  await connectDB();

  const types = await MenuExtraType.find();
  const typeNameById = new Map(
    types.map((type) => [type._id.toString(), type.name]),
  );

  const extras = await MenuExtra.find();
  const extraTypeNameById = new Map(
    extras.map((extra) => [
      extra._id.toString(),
      typeNameById.get(extra.type.toString()) ?? "Suppléments",
    ]),
  );

  const items = await MenuItem.find();
  let migrated = 0;
  let skipped = 0;

  for (const item of items) {
    if (item.extraGroups?.length) {
      skipped += 1;
      continue;
    }

    if (!item.availableExtras?.length) continue;

    const byLabel = new Map<string, mongoose.Types.ObjectId[]>();

    for (const extraId of item.availableExtras) {
      const label = extraTypeNameById.get(extraId.toString()) ?? "Suppléments";
      const bucket = byLabel.get(label) ?? [];
      bucket.push(extraId);
      byLabel.set(label, bucket);
    }

    item.extraGroups = [...byLabel.entries()].map(([label, extraIds]) => ({
      label,
      singleChoice: SINGLE_CHOICE_TYPE_NAMES.includes(label),
      options: extraIds.map((extra) => ({ extra })),
    }));

    await item.save();
    migrated += 1;
    console.log(
      `${item.name} -> ${item.extraGroups.map((g) => g.label).join(", ")}`,
    );
  }

  console.log(`\nProduits migrés : ${migrated}, déjà migrés : ${skipped}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Erreur lors de la migration :", err);
  process.exit(1);
});
