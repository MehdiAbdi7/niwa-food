import { rateLimit } from "express-rate-limit";
import { StatusCodes } from "http-status-codes";
import { errorResponse } from "../utils/responseFormatter.js";

// Limiteur strict pour le login : protège contre le bruteforce de mot de passe
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 tentatives max par IP sur cette fenêtre
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res) => {
    const resetTime = (req as any).rateLimit?.resetTime ?? new Date();
    const diffMs = resetTime.getTime() - Date.now();
    const diffMinutes = Math.max(1, Math.ceil(diffMs / 1000 / 60));

    errorResponse(
      res,
      `Trop de tentatives de connexion, réessayez dans ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`,
      StatusCodes.TOO_MANY_REQUESTS,
    );
  },
});

// Limiteur pour la création de commandes.
// ATTENTION : tous les clients du restaurant passent par le même wifi, donc par
// la même IP publique. Une limite basse bloquerait le service en heure de pointe.
// La valeur ci-dessous vise le bot/spam, pas le débit réel d'un service.
export const createOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    errorResponse(
      res,
      "Trop de commandes créées, réessayez plus tard",
      StatusCodes.TOO_MANY_REQUESTS,
    );
  },
});

/**
 * Limiteur de la recherche par numéro de commande.
 *
 * C'est LE garde-fou de cette route. `/orders/:id/track` est protégé par
 * l'imprévisibilité d'un ObjectId ; `/orders/lookup`, lui, se devine en deux
 * paramètres. Sans limite, on énumère tout le service en cours en une minute.
 *
 * 40 et non 5 comme le login : le même wifi de salle sert tous les clients,
 * donc une seule IP publique pour tout le restaurant. Un client légitime fait
 * une ou deux recherches ; 40 laisse largement passer une soirée normale tout
 * en cassant l'énumération systématique.
 *
 * Ce que voit malgré tout quelqu'un qui insiste : prénom, contenu et montant.
 * Ni téléphone ni adresse — ils sont exclus par TRACKING_FIELDS. Si ce niveau
 * te paraît trop ouvert, la parade est d'exiger le prénom du client en
 * troisième champ : coût nul pour la bonne personne, prohibitif pour l'autre.
 */
export const lookupOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    errorResponse(
      res,
      "Trop de recherches, réessayez dans quelques minutes",
      StatusCodes.TOO_MANY_REQUESTS,
    );
  },
});

/**
 * Limiteur de la vérification de code promo.
 *
 * Un code se devine bien plus facilement qu'un ObjectId : NIWA10, PROMO20,
 * REMISE15, OUVERTURE... Sans limite, quelques centaines de requêtes suffisent
 * à trouver celui qui est en cours, et à le diffuser hors de la campagne pour
 * laquelle il a été créé.
 *
 * 30 sur 15 minutes, et pour la même raison que lookupOrder : tout le
 * restaurant partage une IP publique. Un client légitime tape son code une ou
 * deux fois, trois s'il se trompe ; 30 laisse passer une soirée entière sans
 * jamais gêner, tout en rendant l'énumération inexploitable.
 *
 * NOTE : ce limiteur ne protège QUE la vérification. La création de commande a
 * le sien (createOrderLimiter), plus large — ce qui est correct : on ne veut
 * pas bloquer une commande légitime à cause d'un code mal recopié.
 */
export const promoCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    errorResponse(
      res,
      "Trop de codes essayés, réessayez dans quelques minutes",
      StatusCodes.TOO_MANY_REQUESTS,
    );
  },
});
