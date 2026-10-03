import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Table } from "../models/table.js";
import { User } from "../models/user.js";
import { Order } from "../models/order.js";
import { Store } from "../config/stores.js";

// À adapter selon où se trouvent physiquement tes données existantes
const DEFAULT_STORE: Store = "kouba";

async function main() {
  await connectDB();

  // 1. Renomme les anciens rôles "staff" -> "employee" (via la collection brute,
  // pour éviter que le nouvel enum Mongoose rejette la valeur "staff" en cours de route)
  const roleRename = await User.collection.updateMany(
    { role: "staff" },
    { $set: { role: "employee" } },
  );
  console.log(`Rôles renommés staff -> employee: ${roleRename.modifiedCount}`);

  // 2. Assigne un magasin par défaut aux documents existants
  const tablesResult = await Table.updateMany(
    { store: { $exists: false } },
    { $set: { store: DEFAULT_STORE } },
  );
  console.log(`Tables migrées: ${tablesResult.modifiedCount}`);

  const usersResult = await User.updateMany(
    { role: "employee", store: { $exists: false } },
    { $set: { store: DEFAULT_STORE } },
  );
  console.log(`Employés migrés: ${usersResult.modifiedCount}`);

  const ordersResult = await Order.updateMany(
    { store: { $exists: false } },
    { $set: { store: DEFAULT_STORE } },
  );
  console.log(`Commandes migrées: ${ordersResult.modifiedCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Erreur lors de la migration:", err);
  process.exit(1);
});
