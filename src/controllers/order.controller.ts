import { NextFunction, Request, Response } from "express";
import { type QueryFilter } from "mongoose";
import { Order } from "../models/order.js";
import { Table } from "../models/table.js";
import { IOrder } from "../types/models/order.js";
import { StatusCodes } from "http-status-codes";
import { resolveOrderItemsPricing } from "../utils/pricing.js";
import { io } from "../config/socket.js";
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
  HistoryYearsQuery,
  HistoryMonthsQuery,
  HistoryDaysQuery,
  HistoryOrdersQuery,
} from "../validation/order.js";
import { getNextOrderNumber, resetOrderCounter } from "../utils/dailyNumber.js";

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

    // Cas dine_in : on vérifie si la table a déjà une commande en cours
    if (data.type === "dine_in") {
      const table = await Table.findById(data.table);
      if (!table) {
        errorResponse(res, "Table introuvable", StatusCodes.NOT_FOUND);
        return;
      }

      if (table.currentOrderId) {
        const existingOrder = await Order.findOne({
          _id: table.currentOrderId,
          status: { $in: ["pending", "ready"] },
        });

        // Fusion auto : la table est occupée par une commande pending ou ready -> on ajoute les items dedans
        if (existingOrder) {
          existingOrder.items.push(...resolvedItems);
          if (data.remark) existingOrder.remark = data.remark;
          await existingOrder.save();

          io.to("dashboard").emit("order_items_added", existingOrder);

          successResponse(
            res,
            existingOrder,
            "Produits ajoutés à la commande existante de la table",
          );
          return;
        }
      }

      // Pas de commande en cours -> nouvelle commande + occupation de la table
      const dailyNumber = await getNextOrderNumber();
      const newOrder = await Order.create({
        ...data,
        items: resolvedItems,
        dailyNumber,
      });
      table.currentOrderId = newOrder._id;
      table.status = "occupied";
      await table.save();

      io.to("dashboard").emit("new_order", newOrder);

      successResponse(
        res,
        newOrder,
        "Commande créée avec succès",
        StatusCodes.CREATED,
      );
      return;
    }

    // takeaway / delivery : toujours une commande indépendante
    const dailyNumber = await getNextOrderNumber();
    const newOrder = await Order.create({
      ...data,
      items: resolvedItems,
      dailyNumber,
    });

    io.to("dashboard").emit("new_order", newOrder);

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

export async function getOrders(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { status, type } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const orders = await Order.find(filter)
      .populate("table")
      .sort({ createdAt: -1 });

    successResponse(res, orders, "Commandes récupérées avec succès");
  } catch (error) {
    next(error);
  }
}

// Suppression physique d'une commande — réservé aux admins, et seulement
// pour les commandes qui n'ont pas encore été traitées ou qui sont annulées.
// Une commande ready/out_for_delivery/completed reste en base pour toujours
// (traçabilité + intégrité des stats déjà calculées).
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

    const deletableStatuses = ["pending", "cancelled"];
    if (!deletableStatuses.includes(order.status)) {
      errorResponse(
        res,
        "Seules les commandes en attente ou annulées peuvent être supprimées",
        StatusCodes.BAD_REQUEST,
      );
      return;
    }

    // Si la commande dine_in occupait encore une table, on la libère avant suppression
    if (order.type === "dine_in" && order.table) {
      await Table.updateOne(
        { _id: order.table, currentOrderId: order._id },
        { status: "free", currentOrderId: null },
      );
    }

    await order.deleteOne();

    successResponse(res, null, "Commande supprimée avec succès");
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
    successResponse(res, order, "Commande récupérée avec succès");
  } catch (error) {
    next(error);
  }
}

// Ajout manuel d'items par le staff (takeaway/delivery/dine_in tant que la commande est pending ou ready)
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

    if (order.status == "completed" || order.status == "cancelled") {
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

    successResponse(res, order, "Items ajoutés avec succès");
  } catch (error) {
    next(error);
  }
}

// Le staff fixe le prix de livraison manuellement, une fois la commande reçue au dashboard
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

    if (order.type !== "delivery") {
      errorResponse(
        res,
        "Cette commande n'est pas une livraison",
        StatusCodes.BAD_REQUEST,
      );
      return;
    }

    order.deliveryFee = req.body.deliveryFee;
    await order.save(); // le pre("save") recalcule totalPrice avec le deliveryFee inclus

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

    const newStatus = req.body.status;

    // On ne peut annuler une commande que tant qu'elle est encore pending
    if (newStatus === "cancelled" && order.status !== "pending") {
      errorResponse(
        res,
        "Impossible d'annuler une commande déjà en préparation ou terminée",
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

    // La table n'est libérée qu'une fois la commande payée (completed), pas juste "prête"
    if (
      order.type === "dine_in" &&
      order.status === "completed" &&
      order.table
    ) {
      await Table.findByIdAndUpdate(order.table, {
        status: "free",
        currentOrderId: null,
      });
    }

    // Notifie le client qui suit sa commande à chaque étape pertinente
    if (newStatus === "ready") {
      io.to(`order:${order._id}`).emit("order_ready", order);
    }

    if (newStatus === "out_for_delivery") {
      io.to(`order:${order._id}`).emit("order_out_for_delivery", order);
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
      "type status items.name items.quantity items.variantSelected createdAt",
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

// Reset manuel du compteur de commandes (action staff/admin, aucun déclenchement automatique)
export async function resetCounter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const value = await resetOrderCounter();
    successResponse(res, { value }, "Compteur de commandes réinitialisé");
  } catch (error) {
    next(error);
  }
}

// --- Historique / Stats (drill-down année -> mois -> jour -> liste) ---

export async function getHistoryYears(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { type } = req.query as unknown as HistoryYearsQuery;

    const results = await Order.aggregate([
      { $match: { status: "completed", type, completedAt: { $ne: null } } },
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
    const { type, year } = req.query as unknown as HistoryMonthsQuery;

    const results = await Order.aggregate([
      {
        $match: {
          status: "completed",
          type,
          completedAt: {
            $gte: new Date(Date.UTC(year, 0, 1)),
            $lt: new Date(Date.UTC(year + 1, 0, 1)),
          },
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
    const { type, year, month } = req.query as unknown as HistoryDaysQuery;

    const results = await Order.aggregate([
      {
        $match: {
          status: "completed",
          type,
          completedAt: {
            $gte: new Date(Date.UTC(year, month - 1, 1)),
            $lt: new Date(Date.UTC(year, month, 1)),
          },
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
    const { type, year, month, day, page, limit } =
      req.query as unknown as HistoryOrdersQuery;

    const dayStart = new Date(Date.UTC(year, month - 1, day));
    const dayEnd = new Date(Date.UTC(year, month - 1, day + 1));

    const filter: QueryFilter<IOrder> = {
      status: "completed",
      type,
      completedAt: { $gte: dayStart, $lt: dayEnd },
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
