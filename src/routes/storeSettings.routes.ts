import { Router } from "express";
import {
  getStoreStatuses,
  updateStoreStatus,
} from "../controllers/storeSettings.controller.js";
import { CheckAuth } from "../middlewares/auth.js";
import { validateBodySchema } from "../middlewares/validations.js";
import { updateStoreStatusSchema } from "../validation/storeSettings.js";

const storeRouter = Router();

// Publique : consultée par la carte /commande à chaque chargement.
storeRouter.get("/status", getStoreStatuses);

// CheckAuth sans isAdmin : fermer les commandes est un geste de service, pris
// par le staff en poste. Le magasin visé est imposé par resolveTargetStore.
storeRouter.patch(
  "/status",
  CheckAuth,
  validateBodySchema(updateStoreStatusSchema),
  updateStoreStatus,
);

export default storeRouter;
