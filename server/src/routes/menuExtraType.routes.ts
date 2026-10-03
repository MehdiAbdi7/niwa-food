import { Router } from "express";
import {
  createMenuExtraType,
  getMenuExtraTypes,
  updateMenuExtraType,
  deleteMenuExtraType,
} from "../controllers/menuExtraType.controller.js";
import { CheckAuth, isAdmin } from "../middlewares/auth.js";
import { validateBodySchema } from "../middlewares/validations.js";
import {
  createMenuExtraTypeSchema,
  updateMenuExtraTypeSchema,
} from "../validation/menuExtraType.js";

const menuExtraTypeRouter = Router();

menuExtraTypeRouter.get("/", getMenuExtraTypes);
menuExtraTypeRouter.post(
  "/",
  CheckAuth,
  isAdmin,
  validateBodySchema(createMenuExtraTypeSchema),
  createMenuExtraType,
);
menuExtraTypeRouter.put(
  "/:id",
  CheckAuth,
  isAdmin,
  validateBodySchema(updateMenuExtraTypeSchema),
  updateMenuExtraType,
);
menuExtraTypeRouter.delete("/:id", CheckAuth, isAdmin, deleteMenuExtraType);

export default menuExtraTypeRouter;
