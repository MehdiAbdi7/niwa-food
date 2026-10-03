import { NextFunction, Request, Response } from "express";
import { MenuExtra } from "../models/menuExtra.js";
import { StatusCodes } from "http-status-codes";
import { successResponse } from "../utils/responseFormatter.js";
import {
  CreateMenuExtraInput,
  UpdateMenuExtraInput,
} from "../validation/menuExtra.js";

export async function createMenuExtra(
  req: Request<{}, {}, CreateMenuExtraInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const created = await MenuExtra.create(req.body);
    successResponse(
      res,
      created,
      "Extra créé avec succès",
      StatusCodes.CREATED,
    );
  } catch (error) {
    next(error);
  }
}

export async function getMenuExtras(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const extras = await MenuExtra.find().populate("type").sort({ name: 1 });
    successResponse(res, extras, "Extras récupérés avec succès");
  } catch (error) {
    next(error);
  }
}

export async function updateMenuExtra(
  req: Request<{ id: string }, {}, UpdateMenuExtraInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const updated = await MenuExtra.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Extra introuvable" });
      return;
    }
    successResponse(res, updated, "Extra mis à jour avec succès");
  } catch (error) {
    next(error);
  }
}

export async function deleteMenuExtra(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const deleted = await MenuExtra.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Extra introuvable" });
      return;
    }
    successResponse(res, null, "Extra supprimé avec succès");
  } catch (error) {
    next(error);
  }
}
