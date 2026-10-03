import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Order } from "../models/order.js";
import { toServiceDate } from "../utils/serviceDate.js";

/**
 * Remplit `serviceDate` sur les commandes créées AVANT son introduction.
 *
 * Sans ce rattrapage, tout l'historique existant disparaît de l'écran : les
 * agrégations filtrent sur `serviceDate`, et un champ absent ne matche aucune
 * plage de dates.
 *
 * APPROXIMATION ASSUMÉE : on ne peut pas reconstituer l'heure d'ouverture des
 * services passés — `Counter.lastResetAt` ne garde que celle du service
 * courant. On applique donc une heuristique : une commande créée avant 6h du
 * matin (heure d'Alger) appartient au service de la veille. C'est exact dans
 * l'immense majorité des cas, le service fermant à 00h30.
 *
 * Les commandes créées après cette migration ne passent jamais par ici :
 * elles sont estampillées à la source par issueOrderNumber().
 *
 * IDEMPOTENT : ne touche que les documents dépourvus de `serviceDate`, donc
 * relançable sans risque.
 *
 * À lancer avec :  npx tsx src/scripts/backfillServiceDate.ts
 * Faire un `mongodump` avant, comme pour toute migration.
 */

const ALGIERS_UTC_OFFSET_MS = 60 * 60 * 1000;

// En dessous de cette heure locale, on considère qu'on est encore sur le
// service de la veille.
const NIGHT_CUTOFF_HOUR = 6;

// Écritures groupées : un `save()` par document ferait un aller-retour réseau
// par commande, soit plusieurs minutes sur un historique un peu fourni.
const BATCH_SIZE = 500;

function guessServiceDate(createdAt: Date): Date {
  const local = new Date(createdAt.getTime() + ALGIERS_UTC_OFFSET_MS);

  // On recule d'une journée entière AVANT la normalisation : toServiceDate
  // ne fait que tronquer à minuit, il faut donc lui donner la bonne date.
  const shifted =
    local.getUTCHours() < NIGHT_CUTOFF_HOUR
      ? new Date(createdAt.getTime() - 24 * 60 * 60 * 1000)
      : createdAt;

  return toServiceDate(shifted);
}

async function main() {
  await connectDB();

  const total = await Order.countDocuments({
    serviceDate: { $exists: false },
  });

  if (total === 0) {
    console.log("Aucune commande à rattraper — tout est déjà estampillé.");
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`${total} commande(s) sans serviceDate, rattrapage en cours...`);

  // Curseur : on ne charge jamais toute la collection en mémoire, seulement
  // les deux champs nécessaires, document par document.
  const cursor = Order.find({ serviceDate: { $exists: false } })
    .select("_id createdAt")
    .lean()
    .cursor();

  interface BulkSetOperation {
    updateOne: {
      filter: Record<string, unknown>;
      update: Record<string, unknown>;
    };
  }

  let operations: BulkSetOperation[] = [];
  let processed = 0;

  async function flush() {
    if (operations.length === 0) return;
    // ordered: false — une commande en échec (document supprimé entre-temps)
    // ne doit pas interrompre le rattrapage des 499 autres du lot.
    await Order.bulkWrite(operations as never, { ordered: false });
    processed += operations.length;
    operations = [];
    console.log(`  ${processed} / ${total}`);
  }

  for await (const order of cursor) {
    operations.push({
      updateOne: {
        filter: { _id: order._id },
        // $set brut plutôt qu'un save() : on contourne volontairement les
        // hooks Mongoose. Le pre("save") recalculerait totalPrice à partir
        // d'items dont les prix ont pu changer depuis — l'historique doit
        // rester le reflet de ce qui a été facturé, pas des tarifs du jour.
        update: {
          $set: { serviceDate: guessServiceDate(new Date(order.createdAt)) },
        },
      },
    });

    if (operations.length >= BATCH_SIZE) await flush();
  }

  await flush();

  console.log(`\nTerminé : ${processed} commande(s) rattrapée(s).`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Erreur lors du rattrapage :", err);
  process.exit(1);
});
