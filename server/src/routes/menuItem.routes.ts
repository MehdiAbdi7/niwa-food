import { Router } from "express";
import {
  createMenuItem,
  getMenuItems,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuItem.controller.js";
import { CheckAuth, isAdmin } from "../middlewares/auth.js";
import { validateBodySchema } from "../middlewares/validations.js";
import {
  createMenuItemSchema,
  updateMenuItemSchema,
} from "../validation/menuItem.js";

const menuItemRouter = Router();

menuItemRouter.get("/", getMenuItems);
menuItemRouter.post(
  "/",
  CheckAuth,
  isAdmin,
  validateBodySchema(createMenuItemSchema),
  createMenuItem,
);
menuItemRouter.put(
  "/:id",
  CheckAuth,
  isAdmin,
  validateBodySchema(updateMenuItemSchema),
  updateMenuItem,
);
menuItemRouter.delete("/:id", CheckAuth, isAdmin, deleteMenuItem);

export default menuItemRouter;
