import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import cloudinary from "../config/cloudinary.js";
import { MenuItem } from "../models/menuItem.js";
import { errorResponse, successResponse } from "../utils/responseFormatter.js";

export async function uploadMenuItemImage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    if (!req.file) {
      errorResponse(res, "Aucune image envoyée", StatusCodes.BAD_REQUEST);
      return;
    }

    const item = await MenuItem.findById(id);
    if (!item) {
      errorResponse(res, "Produit introuvable", StatusCodes.NOT_FOUND);
      return;
    }

    // Si une image existait déjà sur ce produit, on la supprime sur Cloudinary
    // AVANT d'uploader la nouvelle, pour éviter un fichier orphelin en cas de remplacement
    if (item.imagePublicId) {
      await cloudinary.uploader.destroy(item.imagePublicId);
    }

    // Upload du buffer vers Cloudinary via un stream (pas de fichier temporaire sur disque)
    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "niwa-food/menu-items" },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result as { secure_url: string; public_id: string });
        },
      );
      uploadStream.end(req.file!.buffer);
    });

    item.imageUrl = uploadResult.secure_url;
    item.imagePublicId = uploadResult.public_id;
    await item.save();

    successResponse(
      res,
      {
        imageUrl: item.imageUrl,
        imagePublicId: item.imagePublicId,
      },
      "Image uploadée avec succès",
      StatusCodes.CREATED,
    );
  } catch (error) {
    next(error);
  }
}

export async function deleteMenuItemImage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    const item = await MenuItem.findById(id);
    if (!item) {
      errorResponse(res, "Produit introuvable", StatusCodes.NOT_FOUND);
      return;
    }

    if (!item.imagePublicId) {
      errorResponse(
        res,
        "Ce produit n'a pas d'image à supprimer",
        StatusCodes.BAD_REQUEST,
      );
      return;
    }

    await cloudinary.uploader.destroy(item.imagePublicId);

    item.imageUrl = undefined;
    item.imagePublicId = undefined;
    await item.save();

    successResponse(res, null, "Image supprimée avec succès", StatusCodes.OK);
  } catch (error) {
    next(error);
  }
}
