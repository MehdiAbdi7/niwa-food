import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { PromoCode } from "../models/promoCode.js";
import { errorResponse, successResponse } from "../utils/responseFormatter.js";
import { resolvePromoCode } from "../utils/promo.js";
import {
  CreatePromoCodeInput,
  UpdatePromoCodeInput,
  ValidatePromoCodeQuery,
} from "../validation/promoCode.js";

/* ------------------------------------------------------------------ */
/*  Administration (admin uniquement)                                  */
/* ------------------------------------------------------------------ */

export async function createPromoCode(
  req: Request<{}, {}, CreatePromoCodeInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    // usedCount et active sont posés par le schéma Mongoose : on ne recopie
    // pas req.body tel quel dans un objet plus large, pour qu'un champ ajouté
    // au validateur plus tard ne se retrouve pas en base par accident.
    const created = await PromoCode.create(req.body);

    successResponse(
      res,
      created,
      "Code promo créé avec succès",
      StatusCodes.CREATED,
    );
  } catch (error) {
    // Le doublon de `code` remonte en 11000, traduit en 409 par le handler
    // global d'app.ts avec le nom du champ.
    next(error);
  }
}

export async function getPromoCodes(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Les codes actifs d'abord, puis les plus récents : c'est ce que l'admin
    // vient consulter, pas l'archive des promotions de l'an dernier.
    const codes = await PromoCode.find().sort({ active: -1, createdAt: -1 });

    successResponse(res, codes, "Codes promo récupérés avec succès");
  } catch (error) {
    next(error);
  }
}

export async function updatePromoCode(
  req: Request<{ id: string }, {}, UpdatePromoCodeInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const promo = await PromoCode.findById(req.params.id);

    if (!promo) {
      errorResponse(res, "Code promo introuvable", StatusCodes.NOT_FOUND);
      return;
    }

    // Object.assign + save() plutôt que findByIdAndUpdate : c'est ce qui fait
    // jouer le pre("validate") du modèle, donc le contrôle de cohérence des
    // dates sur le document COMPLET — celui d'après la fusion, pas seulement
    // sur les champs envoyés.
    Object.assign(promo, req.body);
    await promo.save();

    successResponse(res, promo, "Code promo mis à jour avec succès");
  } catch (error) {
    next(error);
  }
}

/**
 * Suppression physique.
 *
 * Sans danger pour l'historique : la commande porte un INSTANTANÉ du code
 * (voir IOrderPromo), pas une référence vivante. Une vente remisée reste donc
 * lisible, avec son pourcentage et son montant, longtemps après la disparition
 * du code.
 *
 * Pour retirer un code de la circulation sans effacer la trace, l'interrupteur
 * `active` est préférable — et c'est ce que propose le dashboard en premier.
 */
export async function deletePromoCode(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const deleted = await PromoCode.findByIdAndDelete(req.params.id);

    if (!deleted) {
      errorResponse(res, "Code promo introuvable", StatusCodes.NOT_FOUND);
      return;
    }

    successResponse(res, null, "Code promo supprimé avec succès");
  } catch (error) {
    next(error);
  }
}

/* ------------------------------------------------------------------ */
/*  Vérification publique                                              */
/* ------------------------------------------------------------------ */

/**
 * Dit au client, AVANT l'envoi, si son code passe et ce qu'il économise.
 *
 * Route publique et devinable, donc protégée par un limiteur (voir
 * promoCodeLimiter) : sans lui, on énumère NIWA10, PROMO20, REMISE15... en une
 * minute. Même raisonnement que pour /orders/lookup.
 *
 * Ne renvoie AUCUNE des contraintes internes du code — ni le compteur
 * d'usages, ni les dates, ni le minimum de panier autre que dans le message
 * d'erreur. Juste ce qui sert à afficher une ligne de remise.
 *
 * Le montant renvoyé ici est un APERÇU : il est recalculé à la création de la
 * commande, à partir des prix résolus en base. Un client qui truquerait
 * `itemsTotal` ne gagnerait rien de plus qu'un affichage faux chez lui.
 */
export async function validatePromoCode(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { code, itemsTotal, orderType } =
      req.query as unknown as ValidatePromoCodeQuery;

    const { snapshot, discountAmount } = await resolvePromoCode(code, {
      itemsTotal,
      orderType,
    });

    successResponse(
      res,
      {
        code: snapshot.code,
        discountPercent: snapshot.discountPercent,
        maxDiscountAmount: snapshot.maxDiscountAmount ?? null,
        discountAmount,
      },
      "Code promo appliqué",
    );
  } catch (error) {
    // resolvePromoCode lève des erreurs métier avec un statusCode explicite,
    // que le handler global d'app.ts sait déjà traduire.
    next(error);
  }
}
