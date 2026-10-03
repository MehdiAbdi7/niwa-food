import { Router } from "express";
import {
  getStoreStatuses,
  updateStoreStatus,
} from "../controllers/storeSettings.controller.js";
import { CheckAuth, isStaff } from "../middlewares/auth.js";
import { validateBodySchema } from "../middlewares/validations.js";
import { updateStoreStatusSchema } from "../validation/storeSettings.js";

const storeRouter = Router();

// Publique : consultée par la carte /commande à chaque chargement.
storeRouter.get("/status", getStoreStatuses);

// CheckAuth + isStaff, sans isAdmin : fermer les commandes est un geste de
// service, pris par le staff en poste. Le magasin visé est imposé par
// resolveTargetStore.
//
// isStaff est indispensable ici : sans lui, un livreur pourrait couper les
// commandes en ligne de tout un magasin — c'est de loin le dégât le plus
// spectaculaire qu'un compte externe pouvait causer.
storeRouter.patch(
  "/status",
  CheckAuth,
  isStaff,
  validateBodySchema(updateStoreStatusSchema),
  updateStoreStatus,
);

export default storeRouter;
