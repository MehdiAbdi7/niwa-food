import { Router } from "express";
import {
  createPromoCode,
  getPromoCodes,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
} from "../controllers/promoCode.controller.js";
import { CheckAuth, isAdmin, isStaff } from "../middlewares/auth.js";
import {
  validateBodySchema,
  validateQuerySchema,
} from "../middlewares/validations.js";
import {
  createPromoCodeSchema,
  updatePromoCodeSchema,
  validatePromoCodeQuerySchema,
} from "../validation/promoCode.js";
import { promoCodeLimiter } from "../middlewares/rateLimiters.js";

const promoCodeRouter = Router();

/**
 * Vérification publique. STATIQUE, donc AVANT "/:id" — sinon "validate" serait
 * traité comme un identifiant.
 *
 * Le limiteur est indispensable ici : contrairement au reste de ce routeur,
 * cette route n'est protégée par aucune authentification, et un code se devine
 * en quelques dizaines d'essais.
 */
promoCodeRouter.get(
  "/validate",
  promoCodeLimiter,
  validateQuerySchema(validatePromoCodeQuerySchema),
  validatePromoCode,
);

/**
 * Consultation réservée au STAFF et non aux seuls admins : l'employé au
 * comptoir doit pouvoir vérifier qu'un code annoncé au téléphone existe bien,
 * et le saisir sur une commande. La création et la modification, elles,
 * restent admin — c'est une décision commerciale, pas un geste de service.
 */
promoCodeRouter.get("/", CheckAuth, isStaff, getPromoCodes);

promoCodeRouter.post(
  "/",
  CheckAuth,
  isAdmin,
  validateBodySchema(createPromoCodeSchema),
  createPromoCode,
);

promoCodeRouter.put(
  "/:id",
  CheckAuth,
  isAdmin,
  validateBodySchema(updatePromoCodeSchema),
  updatePromoCode,
);

promoCodeRouter.delete("/:id", CheckAuth, isAdmin, deletePromoCode);

export default promoCodeRouter;
