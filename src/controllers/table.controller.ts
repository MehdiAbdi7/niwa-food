import { NextFunction, Request, Response } from "express";
import { Table } from "../models/table.js";
import { StatusCodes } from "http-status-codes";
import { errorResponse, successResponse } from "../utils/responseFormatter.js";
import { getStoreFilter, assertSameStore } from "../utils/storeScope.js";
import {
  CreateTableInput,
  UpdateTableInput,
  PublicTablesQuery,
} from "../validation/table.js";

export async function createTable(
  req: Request<{}, {}, CreateTableInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const created = await Table.create(req.body);
    successResponse(
      res,
      created,
      "Table créée avec succès",
      StatusCodes.CREATED,
    );
  } catch (error) {
    next(error);
  }
}

// Réservé au staff/admin (dashboard) : détail complet, scoped par magasin
export async function getTables(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const filter = getStoreFilter(req.user!);
    const tables = await Table.find(filter).sort({ tableN: 1 });
    successResponse(res, tables, "Tables récupérées avec succès");
  } catch (error) {
    next(error);
  }
}

// Public (page de commande client) : juste de quoi choisir une table dans SON
// magasin. Pas de currentOrderId ni d'autres champs internes exposés.
export async function getPublicTables(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { store } = req.query as unknown as PublicTablesQuery;

    const tables = await Table.find({ store })
      .select("tableN status")
      .sort({ tableN: 1 });

    successResponse(res, tables, "Tables récupérées avec succès");
  } catch (error) {
    next(error);
  }
}

export async function updateTable(
  req: Request<{ id: string }, {}, UpdateTableInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      errorResponse(res, "Table introuvable", StatusCodes.NOT_FOUND);
      return;
    }

    assertSameStore(req.user!, table.store);

    Object.assign(table, req.body);
    await table.save();

    successResponse(res, table, "Table mise à jour avec succès");
  } catch (error) {
    next(error);
  }
}

export async function deleteTable(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      errorResponse(res, "Table introuvable", StatusCodes.NOT_FOUND);
      return;
    }

    assertSameStore(req.user!, table.store);

    // On empêche la suppression d'une table encore occupée par une commande en cours
    if (table.status === "occupied") {
      errorResponse(
        res,
        "Impossible de supprimer une table occupée",
        StatusCodes.BAD_REQUEST,
      );
      return;
    }

    await table.deleteOne();
    successResponse(res, null, "Table supprimée avec succès");
  } catch (error) {
    next(error);
  }
}
