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
