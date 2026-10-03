import { NextFunction, Request, Response } from "express";
import { MenuItem } from "../models/menuItem.js";
import { StatusCodes } from "http-status-codes";
import { successResponse } from "../utils/responseFormatter.js";
import cloudinary from "../config/cloudinary.js";
import {
  CreateMenuItemInput,
  UpdateMenuItemInput,
} from "../validation/menuItem.js";

export async function createMenuItem(
  req: Request<{}, {}, CreateMenuItemInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const created = await MenuItem.create(req.body);
    successResponse(
      res,
      created,
      "Produit créé avec succès",
      StatusCodes.CREATED,
    );
  } catch (error) {
    next(error);
  }
}

export async function getMenuItems(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const items = await MenuItem.find()
      .populate("category")
      .populate("availableExtras")
      // Le front a besoin du nom et de la tarification catalogue de chaque
      // extra pour afficher un prix quand le groupe ne le surcharge pas.
      .populate("extraGroups.options.extra")
      .sort({ name: 1 });
    successResponse(res, items, "Produits récupérés avec succès");
  } catch (error) {
    next(error);
  }
}

export async function updateMenuItem(
  req: Request<{ id: string }, {}, UpdateMenuItemInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const updated = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Produit introuvable" });
      return;
    }
    successResponse(res, updated, "Produit mis à jour avec succès");
  } catch (error) {
    next(error);
  }
}

export async function deleteMenuItem(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const deleted = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Produit introuvable" });
      return;
    }

    // Nettoyage Cloudinary : éviter un fichier orphelin si le produit avait une image
    if (deleted.imagePublicId) {
      await cloudinary.uploader.destroy(deleted.imagePublicId);
    }

    successResponse(res, null, "Produit supprimé avec succès");
  } catch (error) {
    next(error);
  }
}
