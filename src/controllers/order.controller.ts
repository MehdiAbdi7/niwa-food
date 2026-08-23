import { NextFunction, Request, Response } from "express";
import { type QueryFilter } from "mongoose";
import { Order } from "../models/order.js";
import { Table } from "../models/table.js";
import { IOrder } from "../types/models/order.js";
import { StatusCodes } from "http-status-codes";
import { resolveOrderItemsPricing } from "../utils/pricing.js";
import {
  assertSameStore,
  resolveAccessibleStores,
  resolveTargetStore,
} from "../utils/storeScope.js";
import {
  assertStoreAcceptsOrders,
  setStoreStatus,
} from "../utils/storeStatus.js";
import { serviceDateRange } from "../utils/serviceDate.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { Store } from "../config/stores.js";
import { ORDER_TYPES, type OrderType } from "../config/orderTypes.js";
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
  HistoryQuery,
} from "../validation/order.js";
import {
  issueOrderNumber,
  resetOrderCounter,
  getCounterState,
} from "../utils/dailyNumber.js";
import {
  emitOrderCreated,
  emitOrderUpdated,
  emitOrderDeleted,
  emitCounterReset,
  emitOrderTracking,
  emitStoreStatusChanged,
  type OrderTrackingEvent,
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

// Champs exposés au client qui suit sa commande (route publique, sans auth).
// Le détail chiffré est inclus : c'est ce que le client va payer, il doit le
// voir, frais de livraison compris. Ce qui reste exclu est ce qui l'identifie
// — téléphone et adresse : la room de suivi est ouverte à quiconque connaît
// l'id, et un ObjectId peut circuler (capture d'écran, lien partagé).
const TRACKING_FIELDS =
  "type status store dailyNumber items remark deliveryFee totalPrice createdAt completedAt client.fullName";

/**
 * Champs renvoyés dans la LISTE de l'historique.
 *
 * Volontairement minimal : une commande complète pèse ~3 Ko avec ses items,
 * extras et formules, soit 60 Ko pour une page de 20 — pour afficher quatre
 * colonnes. La modale de détail refait déjà son propre GET /orders/:id quand
 * l'utilisateur clique sur une ligne, donc rien n'est perdu.
 */
const HISTORY_LIST_FIELDS =
  "dailyNumber status type store totalPrice completedAt serviceDate createdAt client.fullName";

// Statut atteint -> événement poussé au client. Les quatre y sont : sans
// "completed" ni "cancelled", un client annulé resterait indéfiniment sur
// « en préparation », sans jamais rien comprendre.
const TRACKING_EVENTS: Partial<Record<OrderStatus, OrderTrackingEvent>> = {
  ready: "order_ready",
  out_for_delivery: "order_out_for_delivery",
  completed: "order_completed",
  cancelled: "order_cancelled",
};

export async function createOrder(
  req: Request<{}, {}, CreateOrderInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = req.body;

    // Le staff n'est JAMAIS bloqué par la fermeture des commandes en ligne :
    // il continue de prendre les commandes au comptoir et au téléphone. C'est
    // optionalAuth (voir order.routes.ts) qui renseigne req.user ici — sans
    // lui, cette distinction serait impossible sur une route publique.
    //
    // Contrôle au plus tôt pour takeaway/delivery : le magasin est connu dès
    // le body, inutile de résoudre toute la tarification pour rejeter ensuite.
    // Le cas dine_in est vérifié plus bas, une fois la table résolue.
    if (!req.user && data.type !== "dine_in") {
      await assertStoreAcceptsOrders(data.store);
    }

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

      // Vérifié ici et non plus haut : le magasin d'une commande sur place
      // n'est connu qu'une fois la table chargée. Placé AVANT la fusion, pour
      // qu'un client ne puisse pas se greffer sur la commande d'une table déjà
      // ouverte alors que le restaurant a coupé les commandes en ligne.
      if (!req.user) await assertStoreAcceptsOrders(store);

      // Fusion auto : la table est occupée par une commande pending ou ready
      // -> on ajoute les items dedans au lieu de créer un doublon.
      // La serviceDate de la commande d'accueil est CONSERVÉE : les articles
      // ajoutés appartiennent au même service, quelle que soit l'heure.
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

          // Quelqu'un suit peut-être déjà cette commande depuis son téléphone :
          // son écran doit refléter le nouveau contenu et le nouveau total.
          emitOrderTracking(existingOrder, "order_updated");

          successResponse(
            res,
            existingOrder,
            "Produits ajoutés à la commande existante de la table",
          );
          return;
        }
      }

      // Pas de commande en cours -> nouvelle commande + occupation de la table
      const { dailyNumber, serviceDate } = await issueOrderNumber(store);

      const newOrder = await Order.create({
        ...data,
        store,
        items: resolvedItems,
        dailyNumber,
        serviceDate,
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
    const { dailyNumber, serviceDate } = await issueOrderNumber(data.store);

    const newOrder = await Order.create({
      ...data,
      items: resolvedItems,
      dailyNumber,
      serviceDate,
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

// Statuts supprimables par un admin. "completed" est inclus volontairement :
// l'historique n'étant qu'une agrégation sur `orders`, c'est le seul moyen de
// retirer une commande erronée du chiffre d'affaires. Contrepartie assumée :
// le CA devient modifiable, l'action est donc réservée aux admins (isAdmin
// sur la route) et journalisée ci-dessous.
const DELETABLE_STATUSES: OrderStatus[] = ["pending", "cancelled", "completed"];

// Suppression physique — réservée aux admins.
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

    if (!DELETABLE_STATUSES.includes(order.status)) {
      errorResponse(
        res,
        "Cette commande ne peut pas être supprimée dans son état actuel",
        StatusCodes.BAD_REQUEST,
      );
      return;
    }

    // Trace minimale : supprimer une vente encaissée doit rester retrouvable
    // dans les logs du serveur, même si le document disparaît de la base.
    if (order.status === "completed") {
      console.warn(
        `[SUPPRESSION VENTE] commande #${order.dailyNumber} (${order.store}, ${order.totalPrice} DA) ` +
          `supprimée par ${req.user!.email}`,
      );
    }

    if (order.type === "dine_in" && order.table) {
      await Table.updateOne(
        { _id: order.table, currentOrderId: order._id },
        { status: "free", currentOrderId: null },
      );
    }

    await order.deleteOne();
    emitOrderDeleted(order);

    // Le client suivait peut-être cette commande : le laisser sur un écran
    // figé serait pire que lui dire qu'elle n'existe plus. Le refetch qui
    // suivra renverra un 404, que la page de suivi sait afficher.
    emitOrderTracking(order, "order_cancelled");

    successResponse(res, null, "Commande supprimée avec succès");
  } catch (error) {
    next(error);
  }
}

// Ajout manuel d'items par le staff, tant que la commande n'est pas terminée.
// Volontairement PAS soumis à la fermeture du magasin : une commande passée à
// 00h25 doit pouvoir être complétée, préparée et encaissée à 00h50. Seule la
// création est verrouillée.
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

    // Le total vient de changer : sans cet événement, le client verrait un
    // montant périmé jusqu'au prochain rafraîchissement.
    emitOrderTracking(order, "order_updated");

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

    // Le client voyait « livraison : à confirmer » — c'est maintenant un
    // montant ferme, et c'est ce qu'il va devoir payer.
    emitOrderTracking(order, "order_updated");

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

    // On fige la date de vente réelle au moment du paiement (pas createdAt/updatedAt).
    // ATTENTION : `completedAt` sert à l'affichage (« encaissée à 00h20 ») et au
    // tri fin, JAMAIS au classement dans le calendrier — celui-ci s'appuie
    // exclusivement sur `serviceDate`, figée à la création.
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

    // Le client qui suit sa commande est notifié à chaque étape qui le
    // concerne — y compris les étapes terminales (voir TRACKING_EVENTS).
    const trackingEvent = TRACKING_EVENTS[newStatus];
    if (trackingEvent) emitOrderTracking(order, trackingEvent);

    successResponse(res, order, "Statut de la commande mis à jour");
  } catch (error) {
    next(error);
  }
}

// Suivi public pour le client (sans authentification).
// La projection est volontairement restreinte : voir TRACKING_FIELDS.
export async function trackOrder(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await Order.findById(req.params.id).select(TRACKING_FIELDS);

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

    // Ouvrir le service rouvre les commandes en ligne, et efface le message de
    // fermeture de la veille. Deux interrupteurs indépendants finiraient par
    // diverger, et personne ne remarque des commandes coupées avant que le
    // téléphone ne cesse de sonner.
    const status = await setStoreStatus(store, true);
    emitStoreStatusChanged(status);

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

/* ------------------------------------------------------------------ */
/*  Historique                                                         */
/* ------------------------------------------------------------------ */

/**
 * Filtre magasin de l'historique.
 *
 * `store` est TOUJOURS présent, y compris pour un admin sans filtre — c'est
 * une contrainte d'index, pas une coquetterie : l'index de l'historique est
 * { status, type, store, serviceDate, completedAt }, et MongoDB ne peut pas
 * utiliser un index composé si un champ de son préfixe manque au filtre.
 * L'ancienne version renvoyait `{}` pour un admin, ce qui rendait l'index
 * inutilisable exactement dans le cas qui charge le plus de données.
 *
 * Un employee reste ramené à son magasin, quoi qu'il envoie en query.
 */
function resolveHistoryStoreFilter(
  user: { role: string; store?: Store },
  requestedStore?: Store,
): { store: { $in: Store[] } } {
  return { store: { $in: resolveAccessibleStores(user, requestedStore) } };
}

/**
 * Filtre type de l'historique.
 *
 * `type` absent signifie « Tous les modes de service ». On renvoie malgré tout
 * la clé, avec la liste complète, EXACTEMENT pour la même raison que `store`
 * ci-dessus : `type` est le deuxième champ de l'index
 * { status, type, store, serviceDate, completedAt }. L'omettre romprait le
 * préfixe de l'index, et MongoDB retomberait sur un parcours complet de la
 * collection — précisément dans la vue « Tous », celle qui ratisse le plus.
 *
 * Un `$in` sur trois valeurs reste servi par l'index : MongoDB fait trois
 * parcours ciblés et fusionne, ce qui n'a rien à voir avec un COLLSCAN.
 */
function resolveHistoryTypeFilter(requestedType?: OrderType): {
  type: { $in: readonly OrderType[] };
} {
  return { type: { $in: requestedType ? [requestedType] : ORDER_TYPES } };
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
          ...resolveHistoryTypeFilter(type),
          ...resolveHistoryStoreFilter(req.user!, store),
        },
      },
      {
        // serviceDate étant normalisée à minuit UTC, $year renvoie exactement
        // l'année locale voulue — aucune option `timezone` nécessaire.
        $group: {
          _id: { $year: "$serviceDate" },
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
    const { start, end } = serviceDateRange(year);

    const results = await Order.aggregate([
      {
        $match: {
          status: "completed",
          ...resolveHistoryTypeFilter(type),
          serviceDate: { $gte: start, $lt: end },
          ...resolveHistoryStoreFilter(req.user!, store),
        },
      },
      {
        $group: {
          _id: { $month: "$serviceDate" },
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
    const { start, end } = serviceDateRange(year, month);

    const results = await Order.aggregate([
      {
        $match: {
          status: "completed",
          ...resolveHistoryTypeFilter(type),
          serviceDate: { $gte: start, $lt: end },
          ...resolveHistoryStoreFilter(req.user!, store),
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$serviceDate" },
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

/**
 * Traduit le tri demandé en clé de tri Mongo.
 *
 * `serviceDate` est TOUJOURS la première clé du tri par date : c'est elle qui
 * ordonne les journées commerciales, `completedAt` ne départage qu'à
 * l'intérieur d'un même service. Trier directement sur `completedAt`
 * intercalerait la commande de 00h20 du 1er mars parmi celles du 2.
 *
 * Cet ordre correspond exactement au suffixe de l'index de l'historique, donc
 * MongoDB le sert par simple parcours d'index — y compris en ordre croissant,
 * qu'il obtient en parcourant l'index à l'envers.
 *
 * Les tris par montant et par numéro, eux, imposent un tri en mémoire. C'est
 * assumé : ils ne s'appliquent qu'à un périmètre déjà borné par le calendrier,
 * et créer un index par critère de tri coûterait plus cher à l'écriture qu'il
 * ne rapporte à la lecture.
 */
function buildHistorySort(
  sortBy: HistoryQuery["sortBy"],
  sortOrder: HistoryQuery["sortOrder"],
): Record<string, 1 | -1> {
  const direction: 1 | -1 = sortOrder === "asc" ? 1 : -1;

  if (sortBy === "amount") {
    return { totalPrice: direction, serviceDate: -1, completedAt: -1 };
  }

  if (sortBy === "number") {
    return { serviceDate: -1, dailyNumber: direction };
  }

  return { serviceDate: direction, completedAt: direction };
}

/**
 * Liste paginée de l'historique, tous niveaux de calendrier confondus.
 *
 * Tout le travail — filtrage, recherche, tri, découpage en pages, totaux — est
 * fait par MongoDB. Aucun tableau complet ne remonte jamais en mémoire Node :
 * seules les 20 lignes réellement affichées traversent le réseau.
 */
export async function getHistory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { type, store, year, month, day, search, sortBy, sortOrder, page, limit } =
      req.query as unknown as HistoryQuery;

    const { start, end } = serviceDateRange(year, month, day);

    const filter: QueryFilter<IOrder> = {
      status: "completed",
      ...resolveHistoryTypeFilter(type),
      serviceDate: { $gte: start, $lt: end },
      ...resolveHistoryStoreFilter(req.user!, store),
    };

    if (search) {
      // Record<string, unknown> et non QueryFilter<IOrder> : la condition
      // porte sur "client.fullName", un chemin pointé que le typage strict du
      // modèle ne reconnaît pas comme une clé de IOrder.
      const conditions: Record<string, unknown>[] = [];

      // Une saisie purement numérique vise presque toujours un numéro de
      // commande : on le teste en priorité, et c'est une égalité exacte, donc
      // gratuite. On garde aussi la recherche par nom en parallèle — « 2 »
      // pourrait faire partie d'un nom.
      const asNumber = Number(search);
      if (Number.isInteger(asNumber) && asNumber > 0) {
        conditions.push({ dailyNumber: asNumber });
      }

      // Recherche partielle sur le nom : non indexable, mais elle ne s'exécute
      // que sur les documents déjà retenus par la plage de dates et le type.
      // escapeRegex est indispensable — voir utils/escapeRegex.ts.
      conditions.push({
        "client.fullName": { $regex: escapeRegex(search), $options: "i" },
      });

      filter.$or = conditions;
    }

    const sort = buildHistorySort(sortBy, sortOrder);
    const skip = (page - 1) * limit;

    /**
     * Deux requêtes en parallèle, et non un `$facet` unique.
     *
     * Un `$facet` aurait fait une seule requête, mais MongoDB n'utilise pas
     * l'index pour trier à l'intérieur d'un facet : il aurait chargé et trié en
     * mémoire toutes les commandes de l'année, avec le plafond de 100 Mo au
     * bout. Ici le `find` est servi par l'index, et le `$group` ne fait
     * qu'accumuler des compteurs sans jamais rien trier.
     *
     * Le `$group` renvoie déjà `count` : pas de `countDocuments` supplémentaire.
     */
    const [orders, [summary]] = await Promise.all([
      Order.find(filter)
        .select(HISTORY_LIST_FIELDS)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        // .lean() : documents JS bruts au lieu de documents Mongoose. On ne
        // fait que les sérialiser en JSON, tous les getters/setters/virtuels
        // seraient construits pour rien.
        .lean(),
      Order.aggregate<{ count: number; revenue: number }>([
        { $match: filter },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
          },
        },
      ]),
    ]);

    const totalCount = summary?.count ?? 0;
    const revenue = summary?.revenue ?? 0;

    successResponse(
      res,
      {
        orders,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
        currentPage: page,
        // Le récapitulatif porte sur TOUTE la sélection, pas sur la page
        // affichée : c'est le chiffre que le gérant cherche en ouvrant l'écran.
        summary: {
          count: totalCount,
          revenue,
          averageBasket: totalCount > 0 ? Math.round(revenue / totalCount) : 0,
        },
      },
      "Historique récupéré avec succès",
    );
  } catch (error) {
    next(error);
  }
}
