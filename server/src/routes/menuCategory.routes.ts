import { Router } from "express";
import {
  createMenuCategory,
  getMenuCategories,
  updateMenuCategory,
  deleteMenuCategory,
} from "../controllers/menuCategory.controller.js";
import { CheckAuth, isAdmin } from "../middlewares/auth.js";
import { validateBodySchema } from "../middlewares/validations.js";
import {
  createMenuCategorySchema,
  updateMenuCategorySchema,
} from "../validation/menuCategory.js";

const menuCategoryRouter = Router();

menuCategoryRouter.get("/", getMenuCategories);

menuCategoryRouter.post(
  "/",
  CheckAuth,
  isAdmin,
  validateBodySchema(createMenuCategorySchema),
  createMenuCategory,
);

menuCategoryRouter.put(
  "/:id",
  CheckAuth,
  isAdmin,
  validateBodySchema(updateMenuCategorySchema),
  updateMenuCategory,
);

menuCategoryRouter.delete("/:id", CheckAuth, isAdmin, deleteMenuCategory);

export default menuCategoryRouter;
