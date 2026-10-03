import { NextFunction, Request, Response } from "express";
import { MenuCategory } from "../models/menuCategory.js";
import { StatusCodes } from "http-status-codes";
import { successResponse } from "../utils/responseFormatter.js";
import {
  CreateMenuCategoryInput,
  UpdateMenuCategoryInput,
} from "../validation/menuCategory.js";

export async function createMenuCategory(
  req: Request<{}, {}, CreateMenuCategoryInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const count = await MenuCategory.countDocuments();

    const createdMenuCategory = await MenuCategory.create({
      ...req.body,
      order: count,
    });

    successResponse(
      res,
      createdMenuCategory,
      "Catégorie créée avec succès",
      StatusCodes.CREATED,
    );
  } catch (error) {
    next(error);
  }
}

export async function getMenuCategories(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const categories = await MenuCategory.find().sort({ order: 1 });
    successResponse(res, categories, "Catégories récupérées avec succès");
  } catch (error) {
    next(error);
  }
}

export async function updateMenuCategory(
  req: Request<{ id: string }, {}, UpdateMenuCategoryInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const updatedCategory = await MenuCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!updatedCategory) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Catégorie introuvable" });
      return;
    }

    successResponse(res, updatedCategory, "Catégorie mise à jour avec succès");
  } catch (error) {
    next(error);
  }
}

export async function deleteMenuCategory(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const deletedCategory = await MenuCategory.findByIdAndDelete(req.params.id);

    if (!deletedCategory) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Catégorie introuvable" });
      return;
    }

    successResponse(res, null, "Catégorie supprimée avec succès");
  } catch (error) {
    next(error);
  }
}
