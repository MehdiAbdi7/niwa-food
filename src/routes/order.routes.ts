import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  addItemsToOrder,
  setDeliveryFee,
  setDeliveryPerson,
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
  getMyDeliveries,
  markOrderDelivered,
} from "../controllers/order.controller.js";
import {
  CheckAuth,
  isAdmin,
  isStaff,
  optionalAuth,
} from "../middlewares/auth.js";
import {
  validateBodySchema,
  validateQuerySchema,
} from "../middlewares/validations.js";
import {
  createOrderSchema,
  addItemsToOrderSchema,
  setDeliveryFeeSchema,
  setDeliveryPersonSchema,
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

// isStaff sur TOUTE route qui n'était protégée que par CheckAuth : un livreur
// possède une session valide, donc sans lui il lit les commandes du magasin,
// l'historique et le chiffre d'affaires en tapant l'URL de l'API. Le
// cloisonnement du front ne protège que les pages, jamais les données.

// Routes statiques (historique, service, stats, tracking, livreur) AVANT /:id —
// sinon "/history" serait capturé par "/:id" et traité comme un ObjectId.

/**
 * Liste unifiée de l'historique. Le niveau de précision est déduit des
 * paramètres fournis :
 *   ?type=dine_in&year=2026                -> toute l'année
 *   ?type=dine_in&year=2026&month=3        -> tout le mois
 *   ?type=dine_in&year=2026&month=3&day=14 -> le jour
 */
orderRouter.get(
  "/history",
  CheckAuth,
  isStaff,
  validateQuerySchema(historyQuerySchema),
  getHistory,
);

// Agrégations qui alimentent les CASES du calendrier (compteurs et CA).
// Elles ne renvoient aucune commande, seulement des totaux.
orderRouter.get(
  "/history/years",
  CheckAuth,
  isStaff,
  validateQuerySchema(historyYearsQuerySchema),
  getHistoryYears,
);
orderRouter.get(
  "/history/months",
  CheckAuth,
  isStaff,
  validateQuerySchema(historyMonthsQuerySchema),
  getHistoryMonths,
);
orderRouter.get(
  "/history/days",
  CheckAuth,
  isStaff,
  validateQuerySchema(historyDaysQuerySchema),
  getHistoryDays,
);

orderRouter.get(
  "/stats/service",
  CheckAuth,
  isStaff,
  validateQuerySchema(storeScopeQuerySchema),
  getServiceStats,
);

// Ouverture/clôture de service : accessible aux employés (sur leur magasin),
// car c'est le staff en poste qui ouvre le service, pas l'admin.
orderRouter.get(
  "/counter",
  CheckAuth,
  isStaff,
  validateQuerySchema(storeScopeQuerySchema),
  getCounters,
);
orderRouter.post(
  "/counter/reset",
  CheckAuth,
  isStaff,
  validateBodySchema(resetCounterSchema),
  resetCounter,
);

/**
 * Espace livreur — le SEUL périmètre accessible à un compte `delivery`.
 *
 * Pas d'isStaff ici, évidemment, mais pas de middleware `isDelivery` non plus :
 * le filtre `deliveryPerson: req.user._id` du contrôleur suffit et se suffit
 * à lui-même. Un membre du staff qui appellerait cette route recevrait une
 * liste vide, puisqu'aucune course ne lui est assignée.
 */
orderRouter.get("/my-deliveries", CheckAuth, getMyDeliveries);

orderRouter.get("/:id/track", trackOrder);

orderRouter.get(
  "/",
  CheckAuth,
  isStaff,
  validateQuerySchema(ordersQuerySchema),
  getOrders,
);
orderRouter.get("/:id", CheckAuth, isStaff, getOrderById);

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
  isStaff,
  validateBodySchema(addItemsToOrderSchema),
  addItemsToOrder,
);
orderRouter.patch(
  "/:id/delivery-fee",
  CheckAuth,
  isStaff,
  validateBodySchema(setDeliveryFeeSchema),
  setDeliveryFee,
);
// Correction d'assignation : ALLOWED_TRANSITIONS interdit
// out_for_delivery -> out_for_delivery, donc sans cette route une erreur de
// livreur serait irrattrapable une fois la commande partie.
orderRouter.patch(
  "/:id/delivery-person",
  CheckAuth,
  isStaff,
  validateBodySchema(setDeliveryPersonSchema),
  setDeliveryPerson,
);
orderRouter.patch(
  "/:id/status",
  CheckAuth,
  isStaff,
  validateBodySchema(updateOrderStatusSchema),
  updateOrderStatus,
);

/**
 * Confirmation de remise par le livreur.
 *
 * CheckAuth seul : c'est le contrôle d'appartenance dans le contrôleur
 * (la commande doit lui être assignée) qui fait office d'autorisation. Le
 * staff n'en a pas besoin, il a PATCH /:id/status — qui reste la porte de
 * sortie quand le livreur oublie d'appuyer.
 */
orderRouter.patch("/:id/delivered", CheckAuth, markOrderDelivered);

orderRouter.delete("/:id", CheckAuth, isAdmin, deleteOrder);

export default orderRouter;
