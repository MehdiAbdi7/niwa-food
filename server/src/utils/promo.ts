import { StatusCodes } from "http-status-codes";
import { PromoCode } from "../models/promoCode.js";
import { computeDiscountAmount } from "./orderTotals.js";
import type { OrderType } from "../config/orderTypes.js";
import type { IOrderPromo } from "../types/models/order.js";

function businessError(message: string, statusCode = StatusCodes.BAD_REQUEST) {
  return Object.assign(new Error(message), { statusCode });
}

/**
 * Message unique pour tous les refus qui ne sont pas actionnables.
 *
 * Code inexistant, expiré, épuisé, désactivé : le client ne peut rien y faire,
 * et distinguer les quatre reviendrait à confirmer à un curieux qu'un code
 * existe — exactement ce qu'on évite déjà sur lookupOrder. Les deux seuls refus
 * détaillés sont ceux sur lesquels le client PEUT agir : ajouter un article
 * pour atteindre le minimum, ou changer de mode de service.
 */
const GENERIC_REJECTION = "Ce code promo n'est pas valide";

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: "sur place",
  takeaway: "à emporter",
  delivery: "en livraison",
};

/**
 * Forme canonique d'un code.
 *
 * Appliquée À LA SAISIE (admin) COMME À LA LECTURE (client) : sans les deux,
 * un code enregistré "NIWA10" resterait introuvable pour qui tape "niwa10".
 * Les espaces intérieurs sont retirés aussi — un client qui recopie depuis une
 * story Instagram en laisse toujours traîner un.
 */
export function normalizePromoCode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export interface PromoContext {
  /** Total des articles, extras compris, hors livraison. */
  itemsTotal: number;
  orderType: OrderType;
}

export interface ResolvedPromo {
  /** Ce qui sera figé sur la commande. */
  snapshot: IOrderPromo;
  /** Montant calculé pour CE panier, à titre indicatif (le modèle recalcule). */
  discountAmount: number;
}

/**
 * Vérifie qu'un code s'applique à ce panier, et renvoie son instantané.
 *
 * Le client n'envoie QUE la chaîne du code — jamais un pourcentage, jamais un
 * montant. Même principe que resolveOrderItemsPricing : tout ce qui touche à
 * l'argent est résolu ici, à partir de la base.
 *
 * Ne consomme rien : la réservation est un geste distinct (voir
 * consumePromoCode), pour qu'un panier rejeté plus loin ne brûle pas un usage.
 */
export async function resolvePromoCode(
  rawCode: string,
  { itemsTotal, orderType }: PromoContext,
): Promise<ResolvedPromo> {
  const code = normalizePromoCode(rawCode);

  const promo = await PromoCode.findOne({ code });

  if (!promo || !promo.active) {
    throw businessError(GENERIC_REJECTION, StatusCodes.NOT_FOUND);
  }

  const now = new Date();

  if (promo.startsAt && promo.startsAt > now) {
    throw businessError(GENERIC_REJECTION, StatusCodes.NOT_FOUND);
  }

  if (promo.endsAt && promo.endsAt <= now) {
    throw businessError(GENERIC_REJECTION, StatusCodes.NOT_FOUND);
  }

  if (
    promo.maxUses !== undefined &&
    promo.maxUses !== null &&
    promo.usedCount >= promo.maxUses
  ) {
    throw businessError(GENERIC_REJECTION, StatusCodes.NOT_FOUND);
  }

  // Refus DÉTAILLÉ : le client change de mode de service et le code passe.
  if (promo.orderTypes.length > 0 && !promo.orderTypes.includes(orderType)) {
    const allowed = promo.orderTypes
      .map((type) => ORDER_TYPE_LABELS[type])
      .join(" ou ");

    throw businessError(
      `Ce code s'applique uniquement aux commandes ${allowed}`,
    );
  }

  // Refus DÉTAILLÉ : « ajoutez 300 DA » est une consigne, « code invalide » non.
  if (
    promo.minOrderAmount !== undefined &&
    promo.minOrderAmount !== null &&
    itemsTotal < promo.minOrderAmount
  ) {
    throw businessError(
      `Ce code s'applique à partir de ${promo.minOrderAmount} DA d'articles (votre commande : ${itemsTotal} DA)`,
    );
  }

  const snapshot: IOrderPromo = {
    promoCodeId: promo._id,
    code: promo.code,
    discountPercent: promo.discountPercent,
    ...(promo.maxDiscountAmount !== undefined &&
    promo.maxDiscountAmount !== null
      ? { maxDiscountAmount: promo.maxDiscountAmount }
      : {}),
  };

  return {
    snapshot,
    discountAmount: computeDiscountAmount(
      itemsTotal,
      promo.discountPercent,
      promo.maxDiscountAmount,
    ),
  };
}

/**
 * Réserve un usage, de façon ATOMIQUE.
 *
 * Un `promo.usedCount += 1; await promo.save()` serait faux : entre la lecture
 * de resolvePromoCode et l'écriture, un autre client peut passer. Sur le
 * dernier usage d'un code limité à 50, les deux commandes passeraient et le
 * compteur finirait à 51. La condition est donc portée par la requête
 * elle-même — MongoDB garantit l'atomicité d'un findOneAndUpdate sur un
 * document.
 *
 * `$expr` compare deux champs du MÊME document, ce qu'un filtre classique ne
 * sait pas faire.
 */
export async function consumePromoCode(promoCodeId: unknown): Promise<void> {
  const updated = await PromoCode.findOneAndUpdate(
    {
      _id: promoCodeId,
      active: true,
      $or: [
        { maxUses: null },
        { maxUses: { $exists: false } },
        { $expr: { $lt: ["$usedCount", "$maxUses"] } },
      ],
    },
    { $inc: { usedCount: 1 } },
    { new: true },
  );

  if (!updated) {
    throw businessError(
      "Ce code promo vient d'atteindre sa limite d'utilisation",
      StatusCodes.CONFLICT,
    );
  }
}

/**
 * Rend l'usage réservé quand la commande n'a finalement pas été créée.
 *
 * L'ordre est volontaire dans createOrder : on réserve AVANT d'écrire la
 * commande. L'inverse laisserait une commande remisée sans compteur, ce qui
 * est pire — une remise accordée hors quota se voit sur le chiffre d'affaires,
 * un compteur trop haut ne coûte rien à personne.
 *
 * Ne lève jamais : appelé depuis un catch, il ne doit pas masquer l'erreur
 * d'origine.
 */
export async function releasePromoCode(promoCodeId: unknown): Promise<void> {
  try {
    await PromoCode.updateOne(
      { _id: promoCodeId, usedCount: { $gt: 0 } },
      { $inc: { usedCount: -1 } },
    );
  } catch (error) {
    console.error("[PROMO] Libération impossible", error);
  }
}
