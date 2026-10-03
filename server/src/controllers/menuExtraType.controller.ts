import { NextFunction, Request, Response } from "express";
import { MenuExtraType } from "../models/menuExtraType.js";
import { StatusCodes } from "http-status-codes";
import { successResponse } from "../utils/responseFormatter.js";
import {
  CreateMenuExtraTypeInput,
  UpdateMenuExtraTypeInput,
} from "../validation/menuExtraType.js";

export async function createMenuExtraType(
  req: Request<{}, {}, CreateMenuExtraTypeInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const created = await MenuExtraType.create(req.body);
    successResponse(res, created, "Type créé avec succès", StatusCodes.CREATED);
  } catch (error) {
    next(error);
  }
}

export async function getMenuExtraTypes(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const types = await MenuExtraType.find().sort({ name: 1 });
    successResponse(res, types, "Types récupérés avec succès");
  } catch (error) {
    next(error);
  }
}

export async function updateMenuExtraType(
  req: Request<{ id: string }, {}, UpdateMenuExtraTypeInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const updated = await MenuExtraType.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!updated) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Type introuvable" });
      return;
    }
    successResponse(res, updated, "Type mis à jour avec succès");
  } catch (error) {
    next(error);
  }
}

export async function deleteMenuExtraType(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const deleted = await MenuExtraType.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Type introuvable" });
      return;
    }
    successResponse(res, null, "Type supprimé avec succès");
  } catch (error) {
    next(error);
  }
}
