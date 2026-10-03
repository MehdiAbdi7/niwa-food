import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { errorResponse, successResponse } from "../utils/responseFormatter.js";
import { resolveTargetStore } from "../utils/storeScope.js";
import { getAllStoreStatuses, setStoreStatus } from "../utils/storeStatus.js";
import { emitStoreStatusChanged } from "../utils/orderEvents.js";
import { UpdateStoreStatusInput } from "../validation/storeSettings.js";

// Public : la carte doit pouvoir dire au client qu'un restaurant est fermé
// AVANT qu'il ne compose un panier. Ne renvoie que l'état d'ouverture, aucune
// donnée interne.
export async function getStoreStatuses(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    successResponse(
      res,
      await getAllStoreStatuses(),
      "État des magasins récupéré avec succès",
    );
  } catch (error) {
    next(error);
  }
}

// Accessible aux employés sur leur magasin : c'est le staff en poste qui coupe
// les commandes en cas de rush ou de rupture, pas l'admin depuis chez lui.
export async function updateStoreStatus(
  req: Request<{}, {}, UpdateStoreStatusInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const store = resolveTargetStore(req.user!, req.body.store);

    if (!store) {
      errorResponse(
        res,
        "Magasin requis pour modifier l'état des commandes",
        StatusCodes.BAD_REQUEST,
      );
      return;
    }

    const status = await setStoreStatus(
      store,
      req.body.acceptingOrders,
      req.body.closedMessage ?? null,
    );

    // Sans diffusion, un second poste ouvert sur le dashboard continuerait
    // d'afficher « commandes ouvertes » après la fermeture.
    emitStoreStatusChanged(status);

    successResponse(
      res,
      status,
      status.acceptingOrders
        ? "Commandes en ligne rouvertes"
        : "Commandes en ligne fermées",
    );
  } catch (error) {
    next(error);
  }
}
