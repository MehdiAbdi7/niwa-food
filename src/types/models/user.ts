import { Store } from "../../config/stores.js";

export interface IUser {
  firstname: string;
  lastname: string;
  email: string;
  tel: string;
  password: string;
  role: "admin" | "employee";
  store?: Store; // requis si role === "employee", absent si role === "admin"
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(plain: string): Promise<boolean>;
}
