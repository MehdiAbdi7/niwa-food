import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { MenuItem } from "../models/menuItem.js";

/**
 * Corrige les fautes de saisie relevées sur la carte publique.
 *
 * Ces libellés ont été tapés dans le back-office, ils ne viennent d'aucun
 * seed : la seule correction durable est en base.
 *
 * Simulation par défaut : le script affiche ce qu'il changerait sans rien
 * écrire. Il faut l'option --apply pour modifier la base.
 *
 *   npx tsx src/scripts/fixMenuLabels.ts           (simulation)
 *   npx tsx src/scripts/fixMenuLabels.ts --apply   (écriture)
 *
 * Idempotent : un produit déjà corrigé n'est plus trouvé par son ancien nom,
 * le relancer ne change rien.
 *
 * Attention aux variantes : le backend retrouve la variante d'une commande en
 * comparant sa combinaison (voir utils/pricing.ts). Un panier enregistré
 * AVANT la correction, avec un Galets Box « 1 piece », sera donc refusé à la
 * commande. Acceptable sur une démo ; sur un vrai restaurant, il faudrait le
 * faire en dehors des heures de service.
 */

const APPLY = process.argv.includes("--apply");

// Ancien nom exact -> nouveau nom.
const RENAMES: Record<string, string> = {
  DUCATTI: "DUCATI",
  "Coca cola": "Coca-Cola",
  "Coca zero": "Coca-Cola Zero",
  "coca cola 1L": "Coca-Cola 1 L",
  "bouteille d'eau": "Bouteille d'eau",
};

// Corrections dans les descriptions, par produit.
const DESCRIPTION_FIXES: Record<string, [string, string]> = {
  FUEGO: ["gratinage au 3 poivres", "gratinage aux 3 poivres"],
};

// Variantes de Galets Box : clé et valeurs sans accents.
const VARIANT_FIXES: Record<
  string,
  { key: [string, string]; values: Record<string, string> }
> = {
  "Galets Box": {
    key: ["quantite", "quantité"],
    values: { "1 piece": "1 pièce", "4 pieces": "4 pièces" },
  },
};

async function main() {
  await connectDB();
  console.log(APPLY ? "MODE ÉCRITURE\n" : "SIMULATION (aucune écriture)\n");

  let changes = 0;

  for (const [oldName, newName] of Object.entries(RENAMES)) {
    const item = await MenuItem.findOne({ name: oldName });
    if (!item) {
      console.log(`- "${oldName}" : introuvable (déjà corrigé ?)`);
      continue;
    }
    console.log(`- nom : "${oldName}" -> "${newName}"`);
    item.name = newName;
    if (APPLY) await item.save();
    changes += 1;
  }

  for (const [name, [from, to]] of Object.entries(DESCRIPTION_FIXES)) {
    const item = await MenuItem.findOne({ name });
    if (!item?.description?.includes(from)) {
      console.log(`- description de ${name} : rien à corriger`);
      continue;
    }
    console.log(`- description de ${name} : "${from}" -> "${to}"`);
    item.description = item.description.replace(from, to);
    if (APPLY) await item.save();
    changes += 1;
  }

  for (const [name, fix] of Object.entries(VARIANT_FIXES)) {
    const item = await MenuItem.findOne({ name });
    if (!item) {
      console.log(`- variantes de ${name} : produit introuvable`);
      continue;
    }

    const [oldKey, newKey] = fix.key;
    let touched = false;

    for (const variant of item.variants) {
      const combination = variant.combination as Record<string, string>;
      if (!(oldKey in combination)) continue;

      const oldValue = combination[oldKey];
      const newValue = fix.values[oldValue] ?? oldValue;
      console.log(
        `- variante de ${name} : {${oldKey}: "${oldValue}"} -> {${newKey}: "${newValue}"}`,
      );
      variant.combination = { [newKey]: newValue };
      touched = true;
    }

    if (!touched) {
      console.log(`- variantes de ${name} : rien à corriger`);
      continue;
    }

    // combination est un Schema.Types.Mixed : Mongoose ne détecte pas seul
    // une modification à l'intérieur, il faut la lui signaler.
    item.markModified("variants");
    if (APPLY) await item.save();
    changes += 1;
  }

  console.log(
    `\n${changes} produit(s) ${APPLY ? "corrigé(s)" : "à corriger"}.` +
      (APPLY ? "" : " Relancer avec --apply pour écrire."),
  );

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Erreur :", err);
  process.exit(1);
});
