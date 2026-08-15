import { NextFunction, Request, Response } from "express";
import { type QueryFilter } from "mongoose";
import { Order } from "../models/order.js";
import { Table } from "../models/table.js";
import { IOrder } from "../types/models/order.js";
import { StatusCodes } from "http-status-codes";
import { resolveOrderItemsPricing } from "../utils/pricing.js";
import {
  getStoreFilter,
  assertSameStore,
  resolveAccessibleStores,
} from "../utils/storeScope.js";
import { Store } from "../config/stores.js";
import {
  errorResponse,
  successResponse,
  paginatedResponse,
} from "../utils/responseFormatter.js";
import {
  AddItemsToOrderInput,
  CreateOrderInput,
  SetDeliveryFeeInput,
  UpdateOrderStatusInput,
  ResetCounterInput,
  OrdersQuery,
  StoreScopeQuery,
  HistoryYearsQuery,
  HistoryMonthsQuery,
  HistoryDaysQuery,
  HistoryOrdersQuery,
} from "../validation/order.js";
import {
  getNextOrderNumber,
  resetOrderCounter,
  getCounterState,
} from "../utils/dailyNumber.js";
import {
  emitOrderCreated,
  emitOrderUpdated,
  emitOrderDeleted,
  emitCounterReset,
  emitOrderTracking,
} from "../utils/orderEvents.js";

type OrderStatus = IOrder["status"];

// Commandes encore "vivantes" : celles qui doivent apparaître sur le dashboard
const ACTIVE_STATUSES: OrderStatus[] = ["pending", "ready", "out_for_delivery"];

// Transitions autorisées — empêche de ressusciter une commande terminée
// ou d'inverser accidentellement un statut depuis le dashboard.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["ready", "out_for_delivery", "completed", "cancelled"],
  ready: ["out_for_delivery", "completed"],
  out_for_delivery: ["completed"],
  completed: [],
  cancelled: [],
};

export async function createOrder(
  req: Request<{}, {}, CreateOrderInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = req.body;

    // Résout les vrais prix/noms depuis la base (menuItem + variant + extras).
    // Le client ne fournit que des IDs et des choix, jamais de prix.
    const resolvedItems = await resolveOrderItemsPricing(data.items);

    // Cas dine_in : le magasin est TOUJOURS dérivé de la table, jamais du client
    if (data.type === "dine_in") {
      const table = await Table.findById(data.table);
      if (!table) {
        errorResponse(res, "Table introuvable", StatusCodes.NOT_FOUND);
        return;
      }

      const store = table.store;

      // Fusion auto : la table est occupée par une commande pending ou ready
      // -> on ajoute les items dedans au lieu de créer un doublon
      if (table.currentOrderId) {
        const existingOrder = await Order.findOne({
          _id: table.currentOrderId,
          status: { $in: ["pending", "ready"] },
        });

        if (existingOrder) {
          existingOrder.items.push(...resolvedItems);
          if (data.remark) existingOrder.remark = data.remark;
          await existingOrder.save();

          emitOrderUpdated(existingOrder);

          successResponse(
            res,
            existingOrder,
            "Produits ajoutés à la commande existante de la table",
          );
          return;
        }
      }

      // Pas de commande en cours -> nouvelle commande + occupation de la table
      const dailyNumber = await getNextOrderNumber(store);
      const newOrder = await Order.create({
        ...data,
        store,
        items: resolvedItems,
        dailyNumber,
      });

      table.currentOrderId = newOrder._id;
      table.status = "occupied";
      await table.save();

      emitOrderCreated(newOrder);

      successResponse(
        res,
        newOrder,
        "Commande créée avec succès",
        StatusCodes.CREATED,
      );
      return;
    }

    // takeaway / delivery : le magasin est choisi explicitement par le client
    const dailyNumber = await getNextOrderNumber(data.store);
    const newOrder = await Order.create({
      ...data,
      items: resolvedItems,
      dailyNumber,
    });

    emitOrderCreated(newOrder);

    successResponse(
      res,
      newOrder,
      "Commande créée avec succès",
      StatusCodes.CREATED,
    );
  } catch (error) {
    next(error);
  }
}

// Liste destinée au dashboard : bornée par défaut au service en cours et aux
// commandes actives, pour ne jamais renvoyer tout l'historique par accident.
export async function getOrders(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { status, type, store, scope, page, limit } =
      req.query as unknown as OrdersQuery;

    const stores = resolveAccessibleStores(req.user!, store);
    if (stores.length === 0) {
      successResponse(res, [], "Aucun magasin accessible");
      return;
    }

    const filter: QueryFilter<IOrder> = { store: { $in: stores } };

    if (type) filter.type = type;
    if (status) filter.status = status;
    else if (scope === "active") filter.status = { $in: ACTIVE_STATUSES };

    // Borne "service en cours" : chaque magasin a sa propre heure d'ouverture,
    // d'où un $or par magasin plutôt qu'une date globale.
    if (scope === "service") {
      const states = await Promise.all(stores.map(getCounterState));
      filter.$or = states.map((state) => ({
        store: state.store,
        createdAt: { $gte: state.lastResetAt ?? new Date(0) },
      }));
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("table")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    paginatedResponse(
      res,
      orders,
      {
        totalCount: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
      "Commandes récupérées avec succès",
    );
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await Order.findById(req.params.id).populate("table");
    if (!order) {
      errorResponse(res, "Commande introuvable", StatusCodes.NOT_FOUND);
      return;
    }

    assertSameStore(req.user!, order.store);

    successResponse(res, order, "Commande récupérée avec succès");
  } catch (error) {
    next(error);
  }
}

// Suppression physique — réservée aux admins, et seulement pour les commandes
// qui n'ont pas encore été traitées ou qui sont annulées.
export async function deleteOrder(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      errorResponse(res, "Commande introuvable", StatusCodes.NOT_FOUND);
      return;
    }

    assertSameStore(req.user!, order.store);

    if (!["pending", "cancelled"].includes(order.status)) {
      errorResponse(
        res,
        "Seules les commandes en attente ou annulées peuvent être supprimées",
        StatusCodes.BAD_REQUEST,
      );
      return;
    }

    if (order.type === "dine_in" && order.table) {
      await Table.updateOne(
        { _id: order.table, currentOrderId: order._id },
        { status: "free", currentOrderId: null },
      );
    }

    await order.deleteOne();
    emitOrderDeleted(order);

    successResponse(res, null, "Commande supprimée avec succès");
  } catch (error) {
    next(error);
  }
}

// Ajout manuel d'items par le staff, tant que la commande n'est pas terminée
export async function addItemsToOrder(
  req: Request<{ id: string }, {}, AddItemsToOrderInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      errorResponse(res, "Commande introuvable", StatusCodes.NOT_FOUND);
      return;
    }

    assertSameStore(req.user!, order.store);

    if (order.status === "completed" || order.status === "cancelled") {
      errorResponse(
        res,
        "Impossible de modifier une commande déjà terminée ou annulée",
        StatusCodes.BAD_REQUEST,
      );
      return;
    }

    const resolvedItems = await resolveOrderItemsPricing(req.body.items);

    order.items.push(...resolvedItems);
    await order.save();

    emitOrderUpdated(order);

    successResponse(res, order, "Items ajoutés avec succès");
  } catch (error) {
    next(error);
  }
}

// Le staff fixe le prix de livraison manuellement, une fois la commande reçue
export async function setDeliveryFee(
  req: Request<{ id: string }, {}, SetDeliveryFeeInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      errorResponse(res, "Commande introuvable", StatusCodes.NOT_FOUND);
      return;
    }

    assertSameStore(req.user!, order.store);

    if (order.type !== "delivery") {
      errorResponse(
        res,
        "Cette commande n'est pas une livraison",
        StatusCodes.BAD_REQUEST,
      );
      return;
    }

    order.deliveryFee = req.body.deliveryFee;
    await order.save(); // le pre("save") recalcule totalPrice avec le deliveryFee

    emitOrderUpdated(order);

    successResponse(res, order, "Prix de livraison mis à jour");
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(
  req: Request<{ id: string }, {}, UpdateOrderStatusInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      errorResponse(res, "Commande introuvable", StatusCodes.NOT_FOUND);
      return;
    }

    assertSameStore(req.user!, order.store);

    const newStatus = req.body.status;

    if (!ALLOWED_TRANSITIONS[order.status].includes(newStatus)) {
      errorResponse(
        res,
        `Transition impossible : ${order.status} -> ${newStatus}`,
        StatusCodes.BAD_REQUEST,
      );
      return;
    }

    // out_for_delivery réservé aux commandes delivery
    if (newStatus === "out_for_delivery" && order.type !== "delivery") {
      errorResponse(
        res,
        "Ce statut est réservé aux livraisons",
        StatusCodes.BAD_REQUEST,
      );
      return;
    }

    order.status = newStatus;

    // On fige la date de vente réelle au moment du paiement (pas createdAt/updatedAt)
    if (newStatus === "completed") {
      order.completedAt = new Date();
    }

    await order.save();

    // La table n'est libérée qu'une fois la commande payée, pas juste "prête"
    if (order.type === "dine_in" && newStatus === "completed" && order.table) {
      await Table.findByIdAndUpdate(order.table, {
        status: "free",
        currentOrderId: null,
      });
    }

    // Le dashboard doit voir le changement, quel que soit le poste à l'origine
    emitOrderUpdated(order);

    // Le client qui suit sa commande est notifié aux étapes qui le concernent
    if (newStatus === "ready" || newStatus === "out_for_delivery") {
      emitOrderTracking(order, newStatus);
    }

    successResponse(res, order, "Statut de la commande mis à jour");
  } catch (error) {
    next(error);
  }
}

// Suivi public pour le client (sans authentification), infos limitées uniquement
export async function trackOrder(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await Order.findById(req.params.id).select(
      "type status dailyNumber items.name items.quantity items.variantSelected createdAt",
    );

    if (!order) {
      errorResponse(res, "Commande introuvable", StatusCodes.NOT_FOUND);
      return;
    }

    successResponse(res, order, "Suivi de la commande récupéré avec succès");
  } catch (error) {
    next(error);
  }
}

// --- Service (compteur de commandes) ---

// Un employee ouvre/clôture le service de SON magasin ; l'admin doit préciser
// lequel. Le service n'est pas calé sur la date calendaire car il déborde
// régulièrement sur le lendemain.
function resolveTargetStore(
  user: { role: string; store?: Store },
  requested?: Store,
): Store | null {
  if (user.role === "admin") return requested ?? null;
  return user.store ?? null;
}

export async function getCounters(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { store } = req.query as unknown as StoreScopeQuery;
    const stores = resolveAccessibleStores(req.user!, store);

    const states = await Promise.all(stores.map(getCounterState));

    successResponse(res, states, "État des services récupéré avec succès");
  } catch (error) {
    next(error);
  }
}

export async function resetCounter(
  req: Request<{}, {}, ResetCounterInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.user!;
    const store = resolveTargetStore(user, req.body.store);

    if (!store) {
      errorResponse(
        res,
        "Magasin requis pour ouvrir un nouveau service",
        StatusCodes.BAD_REQUEST,
      );
      return;
    }

    // Garde-fou : rouvrir un service alors que des commandes sont en cours
    // produirait deux commandes portant le même numéro dans la même soirée.
    const activeCount = await Order.countDocuments({
      store,
      status: { $in: ACTIVE_STATUSES },
    });

    const canForce = user.role === "admin" && req.body.force;

    if (activeCount > 0 && !canForce) {
      errorResponse(
        res,
        `${activeCount} commande(s) encore en cours sur ce magasin — terminez-les avant d'ouvrir un nouveau service`,
        StatusCodes.CONFLICT,
      );
      return;
    }

    const state = await resetOrderCounter(store);
    emitCounterReset(state);

    successResponse(res, state, "Nouveau service ouvert");
  } catch (error) {
    next(error);
  }
}

// --- Statistiques du service en cours ---

export async function getServiceStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { store } = req.query as unknown as StoreScopeQuery;
    const stores = resolveAccessibleStores(req.user!, store);

    const stats = await Promise.all(
      stores.map(async (currentStore) => {
        const { value, lastResetAt } = await getCounterState(currentStore);
        const since = lastResetAt ?? new Date(0);

        // Un seul aller-retour Mongo par magasin grâce à $facet
        const [result] = await Order.aggregate([
          { $match: { store: currentStore, createdAt: { $gte: since } } },
          {
            $facet: {
              totals: [
                {
                  $group: {
                    _id: null,
                    orders: { $sum: 1 },
                    completed: {
                      $sum: {
                        $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
                      },
                    },
                    revenue: {
                      $sum: {
                        $cond: [
                          { $eq: ["$status", "completed"] },
                          "$totalPrice",
                          0,
                        ],
                      },
                    },
                  },
                },
              ],
              byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
              byType: [
                {
                  $group: {
                    _id: "$type",
                    count: { $sum: 1 },
                    revenue: {
                      $sum: {
                        $cond: [
                          { $eq: ["$status", "completed"] },
                          "$totalPrice",
                          0,
                        ],
                      },
                    },
                  },
                },
              ],
              topItems: [
                { $unwind: "$items" },
                {
                  $group: {
                    _id: "$items.name",
                    quantity: { $sum: "$items.quantity" },
                  },
                },
                { $sort: { quantity: -1 } },
                { $limit: 5 },
                { $project: { _id: 0, name: "$_id", quantity: 1 } },
              ],
            },
          },
        ]);

        const totals = result?.totals?.[0] ?? {
          orders: 0,
          completed: 0,
          revenue: 0,
        };

        return {
          store: currentStore,
          serviceStartedAt: lastResetAt,
          lastOrderNumber: value,
          orders: totals.orders,
          completed: totals.completed,
          revenue: totals.revenue,
          averageBasket:
            totals.completed > 0
              ? Math.round(totals.revenue / totals.completed)
              : 0,
          byStatus: Object.fromEntries(
            (result?.byStatus ?? []).map(
              (entry: { _id: string; count: number }) => [
                entry._id,
                entry.count,
              ],
            ),
          ),
          byType: result?.byType ?? [],
          topItems: result?.topItems ?? [],
        };
      }),
    );

    successResponse(res, stats, "Statistiques du service récupérées");
  } catch (error) {
    next(error);
  }
}

// --- Historique / Stats (drill-down année -> mois -> jour -> liste) ---

// Un employee est toujours restreint à son magasin, même s'il tente de passer
// un autre store en query. Un admin peut filtrer sur un magasin précis ou voir
// l'ensemble (store absent du filtre).
function resolveHistoryStoreFilter(
  user: { role: string; store?: Store },
  requestedStore?: Store,
): { store?: Store } {
  if (user.role !== "admin") return getStoreFilter(user);
  return requestedStore ? { store: requestedStore } : {};
}

export async function getHistoryYears(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { type, store } = req.query as unknown as HistoryYearsQuery;

    const results = await Order.aggregate([
      {
        $match: {
          status: "completed",
          type,
          completedAt: { $ne: null },
          ...resolveHistoryStoreFilter(req.user!, store),
        },
      },
      {
        $group: {
          _id: { $year: "$completedAt" },
          count: { $sum: 1 },
          totalSales: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: -1 } },
      { $project: { _id: 0, year: "$_id", count: 1, totalSales: 1 } },
    ]);

    successResponse(res, results, "Historique par année récupéré avec succès");
  } catch (error) {
    next(error);
  }
}

export async function getHistoryMonths(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { type, year, store } = req.query as unknown as HistoryMonthsQuery;

    const results = await Order.aggregate([
      {
        $match: {
          status: "completed",
          type,
          completedAt: {
            $gte: new Date(Date.UTC(year, 0, 1)),
            $lt: new Date(Date.UTC(year + 1, 0, 1)),
          },
          ...resolveHistoryStoreFilter(req.user!, store),
        },
      },
      {
        $group: {
          _id: { $month: "$completedAt" },
          count: { $sum: 1 },
          totalSales: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, month: "$_id", count: 1, totalSales: 1 } },
    ]);

    successResponse(res, results, "Historique par mois récupéré avec succès");
  } catch (error) {
    next(error);
  }
}

export async function getHistoryDays(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { type, year, month, store } =
      req.query as unknown as HistoryDaysQuery;

    const results = await Order.aggregate([
      {
        $match: {
          status: "completed",
          type,
          completedAt: {
            $gte: new Date(Date.UTC(year, month - 1, 1)),
            $lt: new Date(Date.UTC(year, month, 1)),
          },
          ...resolveHistoryStoreFilter(req.user!, store),
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$completedAt" },
          count: { $sum: 1 },
          totalSales: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, day: "$_id", count: 1, totalSales: 1 } },
    ]);

    successResponse(res, results, "Historique par jour récupéré avec succès");
  } catch (error) {
    next(error);
  }
}

export async function getHistoryOrders(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { type, year, month, day, page, limit, store } =
      req.query as unknown as HistoryOrdersQuery;

    const dayStart = new Date(Date.UTC(year, month - 1, day));
    const dayEnd = new Date(Date.UTC(year, month - 1, day + 1));

    const filter: QueryFilter<IOrder> = {
      status: "completed",
      type,
      completedAt: { $gte: dayStart, $lt: dayEnd },
      ...resolveHistoryStoreFilter(req.user!, store),
    };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ completedAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    paginatedResponse(res, orders, {
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
}
