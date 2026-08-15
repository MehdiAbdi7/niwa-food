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
  getHistoryYears,
  getHistoryMonths,
  getHistoryDays,
  getHistoryOrders,
} from "../controllers/order.controller.js";
import { CheckAuth, isAdmin } from "../middlewares/auth.js";
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
  historyYearsQuerySchema,
  historyMonthsQuerySchema,
  historyDaysQuerySchema,
  historyOrdersQuerySchema,
  resetCounterSchema,
} from "../validation/order.js";
import { createOrderLimiter } from "../middlewares/rateLimiters.js";

const orderRouter = Router();

// Routes statiques (historique, service, stats, tracking) AVANT /:id
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
  "/history/orders",
  CheckAuth,
  validateQuerySchema(historyOrdersQuerySchema),
  getHistoryOrders,
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

orderRouter.post(
  "/",
  createOrderLimiter,
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
