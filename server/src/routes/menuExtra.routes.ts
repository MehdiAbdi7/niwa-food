import { Router } from "express";
import {
  createMenuExtra,
  getMenuExtras,
  updateMenuExtra,
  deleteMenuExtra,
} from "../controllers/menuExtra.controller.js";
import { CheckAuth, isAdmin } from "../middlewares/auth.js";
import { validateBodySchema } from "../middlewares/validations.js";
import {
  createMenuExtraSchema,
  updateMenuExtraSchema,
} from "../validation/menuExtra.js";

const menuExtraRouter = Router();

menuExtraRouter.get("/", getMenuExtras);
menuExtraRouter.post(
  "/",
  CheckAuth,
  isAdmin,
  validateBodySchema(createMenuExtraSchema),
  createMenuExtra,
);
menuExtraRouter.put(
  "/:id",
  CheckAuth,
  isAdmin,
  validateBodySchema(updateMenuExtraSchema),
  updateMenuExtra,
);
menuExtraRouter.delete("/:id", CheckAuth, isAdmin, deleteMenuExtra);

export default menuExtraRouter;
