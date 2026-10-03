import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/user.js";

async function main() {
  await connectDB();

  const existing = await User.findOne({ email: process.env.SEED_ADMIN_EMAIL });

  if (existing) {
    console.log("Un admin avec cet email existe déjà, script annulé.");
    await mongoose.disconnect();
    process.exit(0);
  }

  const admin = await User.create({
    firstname: process.env.SEED_ADMIN_FIRSTNAME,
    lastname: process.env.SEED_ADMIN_LASTNAME,
    email: process.env.SEED_ADMIN_EMAIL,
    tel: process.env.SEED_ADMIN_TEL,
    password: process.env.SEED_ADMIN_PASSWORD,
    role: "admin",
  });

  console.log("Admin créé avec succès:", admin.email);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Erreur lors de la création de l'admin:", err);
  process.exit(1);
});
