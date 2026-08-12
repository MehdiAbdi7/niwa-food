import { model, Model, Schema } from "mongoose";
import { IUser, IUserMethods } from "../types/models/user.js";
import bcrypt from "bcrypt";
import { STORES } from "../config/stores.js";

type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    tel: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "employee"], default: "employee" },
    store: { type: String, enum: STORES },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.virtual("isAdmin").get(function () {
  return this.role === "admin";
});

// Garantit l'intégrité même si User.create() est appelé hors des routes
// (scripts, migrations) : store obligatoire pour un employee, interdit pour un admin.
userSchema.pre("validate", function () {
  if (this.role === "employee" && !this.store) {
    throw new Error("Un employé doit être rattaché à un magasin (store)");
  }
  if (this.role === "admin" && this.store) {
    this.store = undefined;
  }
});

userSchema.pre("save", async function () {
  if (this.isNew || this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.comparePassword = async function (
  requestedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(requestedPassword, this.password);
};

export const User = model<IUser, UserModel>("User", userSchema);
