import { NextFunction, Request, Response } from "express";
import { Table } from "../models/table.js";
import { Order } from "../models/order.js";
import { StatusCodes } from "http-status-codes";
import { errorResponse, successResponse } from "../utils/responseFormatter.js";
import { assertSameStore, resolveAccessibleStores } from "../utils/storeScope.js";
import {
  CreateTableInput,
  UpdateTableInput,
  PublicTablesQuery,
  TablesQuery,
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

// Réservé au staff/admin (dashboard) : détail complet, scoped par magasin.
// L'admin peut cibler un magasin précis via ?store=, sinon il voit les deux.
export async function getTables(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { store } = req.query as unknown as TablesQuery;
    const stores = resolveAccessibleStores(req.user!, store);

    const tables = await Table.find({ store: { $in: stores } }).sort({
      store: 1,
      tableN: 1,
    });

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

// Libération manuelle par le staff : cas d'une table restée "occupied" alors
// que la commande a été annulée ou encaissée hors flux normal. Accessible aux
// employés, contrairement au reste du CRUD table qui est admin.
export async function freeTable(
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

    // On refuse de libérer une table dont la commande est encore à traiter,
    // sinon la commande devient orpheline et disparaît de la vue "salle".
    if (table.currentOrderId) {
      const activeOrder = await Order.findOne({
        _id: table.currentOrderId,
        status: { $in: ["pending", "ready"] },
      });

      if (activeOrder) {
        errorResponse(
          res,
          `Commande n°${activeOrder.dailyNumber} encore en cours sur cette table`,
          StatusCodes.CONFLICT,
        );
        return;
      }
    }

    table.status = "free";
    table.currentOrderId = null;
    await table.save();

    successResponse(res, table, "Table libérée avec succès");
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
