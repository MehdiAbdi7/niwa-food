import type { Types } from "mongoose";
import type { IUser } from "./models/user.js";

declare global {
  namespace Express {
    interface Request {
      user?: Omit<IUser, "password"> & { _id: Types.ObjectId };
      parsedQuery?: unknown;
    }
  }
}

export type {};
