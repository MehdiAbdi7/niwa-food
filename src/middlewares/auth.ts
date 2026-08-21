import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { errorResponse } from "../utils/responseFormatter.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { AUTH_COOKIE_NAME } from "../config/cookies.js";

interface AccessTokenPayload {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Le header accepte deux formes : "Bearer <token>" (convention REST) et le
// token brut (ce qu'envoie Postman quand on colle la valeur telle quelle).
// L'ancienne implémentation faisait split(" ")[1] sans condition et renvoyait
// undefined sur la seconde forme.
function extractTokenFromHeader(header?: string): string | undefined {
  if (!header) return undefined;

  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() === "bearer") return value;

  return header;
}

// Le cookie prime sur le header : c'est le canal du navigateur, celui qui
// porte la session réelle. Le header reste accepté pour Postman, les scripts
// et les tests — aucune collection existante ne casse.
export function extractToken(req: Request): string | undefined {
  return (
    req.cookies?.[AUTH_COOKIE_NAME] ??
    extractTokenFromHeader(req.headers.authorization)
  );
}

export async function CheckAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      errorResponse(res, "Authentification requise", StatusCodes.UNAUTHORIZED);
      return;
    }

    // Les erreurs de jwt.verify (signature invalide, token expiré) partent
    // dans le catch puis dans le handler global d'app.ts, qui les traduit
    // déjà en 401 avec un message adapté.
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as AccessTokenPayload;

    const user = await User.findById(payload.id).select("-password");
    if (!user) {
      errorResponse(
        res,
        "Compte introuvable ou supprimé",
        StatusCodes.UNAUTHORIZED,
      );
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Identifie l'appelant SI c'est possible, sans jamais bloquer.
 *
 * Indispensable sur les routes partagées entre le public et le staff —
 * typiquement POST /orders, utilisé aussi bien par la page /commande que par
 * la prise de commande au comptoir. Sans ce middleware, req.user y est
 * TOUJOURS undefined : le cookie part bien avec la requête, mais personne ne
 * le décode, donc impossible de distinguer les deux publics.
 *
 * Un token absent, expiré ou forgé ne produit aucune erreur : la requête
 * continue en anonyme. C'est toute la différence avec CheckAuth — ici,
 * l'authentification est une information, pas une condition d'accès. Ne jamais
 * s'en servir pour protéger une route : elle ne protège rien.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as AccessTokenPayload;

    const user = await User.findById(payload.id).select("-password");
    if (user) req.user = user;
  } catch {
    // Token expiré ou invalide : on poursuit en anonyme plutôt que de
    // renvoyer 401. Un client dont la session staff a expiré doit pouvoir
    // continuer à commander comme n'importe quel visiteur.
  }

  next();
}

export function isAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role === "admin") {
    next();
    return;
  }

  errorResponse(
    res,
    "Accès réservé aux administrateurs",
    StatusCodes.FORBIDDEN,
  );
}
