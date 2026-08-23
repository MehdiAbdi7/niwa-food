import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  addItemsToOrder,
  setDeliveryFee,
  updateOrderStatus,
  trackOrder,
  resetCounter,
  getCounters,
  getServiceStats,
  deleteOrder,
  getHistory,
  getHistoryYears,
  getHistoryMonths,
  getHistoryDays,
} from "../controllers/order.controller.js";
import { CheckAuth, isAdmin, optionalAuth } from "../middlewares/auth.js";
import {
  validateBodySchema,
  validateQuerySchema,
} from "../middlewares/validations.js";
import {
  createOrderSchema,
  addItemsToOrderSchema,
  setDeliveryFeeSchema,
  updateOrderStatusSchema,
  ordersQuerySchema,
  storeScopeQuerySchema,
  historyQuerySchema,
  historyYearsQuerySchema,
  historyMonthsQuerySchema,
  historyDaysQuerySchema,
  resetCounterSchema,
} from "../validation/order.js";
import { createOrderLimiter } from "../middlewares/rateLimiters.js";

const orderRouter = Router();

// Routes statiques (historique, service, stats, tracking) AVANT /:id —
// sinon "/history" serait capturé par "/:id" et traité comme un ObjectId.

/**
 * Liste unifiée de l'historique. Le niveau de précision est déduit des
 * paramètres fournis :
 *   ?type=dine_in&year=2026                -> toute l'année
 *   ?type=dine_in&year=2026&month=3        -> tout le mois
 *   ?type=dine_in&year=2026&month=3&day=14 -> le jour
 *
 * Remplace l'ancien GET /history/orders, qui n'existait qu'au niveau jour.
 */
orderRouter.get(
  "/history",
  CheckAuth,
  validateQuerySchema(historyQuerySchema),
  getHistory,
);

// Agrégations qui alimentent les CASES du calendrier (compteurs et CA).
// Elles ne renvoient aucune commande, seulement des totaux.
orderRouter.get(
  "/history/years",
  CheckAuth,
  validateQuerySchema(historyYearsQuerySchema),
  getHistoryYears,
);
orderRouter.get(
  "/history/months",
  CheckAuth,
  validateQuerySchema(historyMonthsQuerySchema),
  getHistoryMonths,
);
orderRouter.get(
  "/history/days",
  CheckAuth,
  validateQuerySchema(historyDaysQuerySchema),
  getHistoryDays,
);

orderRouter.get(
  "/stats/service",
  CheckAuth,
  validateQuerySchema(storeScopeQuerySchema),
  getServiceStats,
);

// Ouverture/clôture de service : accessible aux employés (sur leur magasin),
// car c'est le staff en poste qui ouvre le service, pas l'admin.
orderRouter.get(
  "/counter",
  CheckAuth,
  validateQuerySchema(storeScopeQuerySchema),
  getCounters,
);
orderRouter.post(
  "/counter/reset",
  CheckAuth,
  validateBodySchema(resetCounterSchema),
  resetCounter,
);

orderRouter.get("/:id/track", trackOrder);

orderRouter.get(
  "/",
  CheckAuth,
  validateQuerySchema(ordersQuerySchema),
  getOrders,
);
orderRouter.get("/:id", CheckAuth, getOrderById);

// optionalAuth et NON CheckAuth : cette route reste publique (page /commande),
// mais le contrôleur a besoin de savoir si l'appelant est un membre du staff —
// c'est ce qui lui permet de prendre une commande au comptoir alors que les
// commandes en ligne sont fermées.
orderRouter.post(
  "/",
  createOrderLimiter,
  optionalAuth,
  validateBodySchema(createOrderSchema),
  createOrder,
);
orderRouter.patch(
  "/:id/items",
  CheckAuth,
  validateBodySchema(addItemsToOrderSchema),
  addItemsToOrder,
);
orderRouter.patch(
  "/:id/delivery-fee",
  CheckAuth,
  validateBodySchema(setDeliveryFeeSchema),
  setDeliveryFee,
);
orderRouter.patch(
  "/:id/status",
  CheckAuth,
  validateBodySchema(updateOrderStatusSchema),
  updateOrderStatus,
);
orderRouter.delete("/:id", CheckAuth, isAdmin, deleteOrder);

export default orderRouter;
