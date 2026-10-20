import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.js";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { errorResponse, successResponse } from "../utils/responseFormatter.js";
import { resolveAccessibleStores } from "../utils/storeScope.js";
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  clearAuthCookieOptions,
} from "../config/cookies.js";
import {
  UpdateUserInput,
  UsersQuery,
  UpdateProfileInput,
} from "../validation/user.js";

export async function login(req: Request, res: Response, next: NextFunction) {
  const { password, email } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      errorResponse(
        res,
        "Email ou mot de passe invalide",
        StatusCodes.UNAUTHORIZED,
      );
      return;
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      errorResponse(
        res,
        "Email ou mot de passe invalide",
        StatusCodes.UNAUTHORIZED,
      );
      return;
    }

    const userInfo = { id: user._id.toString(), role: user.role };

    const token = jwt.sign(userInfo, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    } as jwt.SignOptions);

    // Canal principal : cookie httpOnly, illisible en JavaScript.
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);

    const userObj = user.toObject() as unknown as Record<string, unknown>;
    delete userObj.password;

    // Le token reste dans le corps de la réponse le temps de la migration :
    // Postman et toute version du front encore basée sur le header continuent
    // de fonctionner.
    successResponse(res, userObj, "Connexion réussie", StatusCodes.OK, token);
  } catch (error) {
    next(error);
  }
}

// Avec un cookie httpOnly, le client ne peut plus effacer le token lui-même :
// la déconnexion doit obligatoirement passer par le serveur.
export async function logout(_req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions);
    successResponse(res, null, "Déconnexion réussie");
  } catch (error) {
    next(error);
  }
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const createdUser = await User.create(req.body);

    const userObj = createdUser.toObject() as unknown as Record<
      string,
      unknown
    >;
    delete userObj.password;

    successResponse(
      res,
      userObj,
      "Compte créé avec succès",
      StatusCodes.CREATED,
    );
  } catch (error) {
    next(error);
  }
}

export async function checkUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      errorResponse(res, "Utilisateur introuvable", StatusCodes.UNAUTHORIZED);
      return;
    }
    successResponse(res, req.user, "Utilisateur authentifié");
  } catch (error) {
    next(error);
  }
}

// --- Gestion des utilisateurs (admin uniquement) ---

export async function getUsers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { store, role } = req.query as unknown as UsersQuery;

    const filter: Record<string, unknown> = {};
    if (store) filter.store = store;
    if (role) filter.role = role;

    const users = await User.find(filter).sort({ role: 1, firstname: 1 });

    successResponse(res, users, "Utilisateurs récupérés avec succès");
  } catch (error) {
    next(error);
  }
}

/**
 * Livreurs assignables, pour le sélecteur de la fiche commande.
 *
 * Route DISTINCTE de GET /auth/users, qui est réservée aux admins : c'est
 * l'employé au comptoir qui envoie une commande en livraison, il lui faut donc
 * cette liste. Elle est volontairement minimale — prénom, nom, téléphone,
 * magasin — et bornée aux magasins auxquels l'appelant a accès, ce qui évite
 * d'ouvrir l'annuaire complet du personnel à tout le staff.
 */
export async function getDeliveryPersons(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const stores = resolveAccessibleStores(req.user!);

    const persons = await User.find({
      role: "delivery",
      store: { $in: stores },
    })
      .select("firstname lastname tel store")
      .sort({ firstname: 1 });

    successResponse(res, persons, "Livreurs récupérés avec succès");
  } catch (error) {
    next(error);
  }
}

export async function updateUser(
  req: Request<{ id: string }, {}, UpdateUserInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      errorResponse(res, "Utilisateur introuvable", StatusCodes.NOT_FOUND);
      return;
    }

    // On ne laisse pas rétrograder le dernier admin : plus personne
    // ne pourrait alors créer de comptes ni administrer le menu.
    // La condition porte sur « cesse d'être admin », et non sur le seul rôle
    // employee — sans ça, passer le dernier admin en livreur passerait.
    if (
      user.role === "admin" &&
      req.body.role !== undefined &&
      req.body.role !== "admin"
    ) {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        errorResponse(
          res,
          "Impossible de rétrograder le dernier administrateur",
          StatusCodes.BAD_REQUEST,
        );
        return;
      }
    }

    Object.assign(user, req.body);

    // Le pre("validate") du modèle se charge de la cohérence role/store
    // (employee et delivery doivent avoir un magasin, un admin n'en a jamais).
    await user.save();

    const userObj = user.toObject() as unknown as Record<string, unknown>;
    delete userObj.password;

    successResponse(res, userObj, "Utilisateur mis à jour avec succès");
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    if (req.params.id === req.user!._id.toString()) {
      errorResponse(
        res,
        "Vous ne pouvez pas supprimer votre propre compte",
        StatusCodes.BAD_REQUEST,
      );
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      errorResponse(res, "Utilisateur introuvable", StatusCodes.NOT_FOUND);
      return;
    }

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        errorResponse(
          res,
          "Impossible de supprimer le dernier administrateur",
          StatusCodes.BAD_REQUEST,
        );
        return;
      }
    }

    await user.deleteOne();

    successResponse(res, null, "Utilisateur supprimé avec succès");
  } catch (error) {
    next(error);
  }
}

// --- Profil personnel (admin uniquement, sur son propre compte) ---

// Volontairement séparé de updateUser : celui-ci n'accepte ni `role` ni
// `store`. La route est réservée à l'admin (isAdmin), mais la restriction
// reste : si la route est un jour rouverte aux autres rôles, un employee ou un
// livreur ne pourra toujours pas s'auto-promouvoir admin. Toute route
// self-service doit rester strictement plus restrictive que la route admin
// équivalente.
export async function updateOwnProfile(
  req: Request<{}, {}, UpdateProfileInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      errorResponse(res, "Utilisateur introuvable", StatusCodes.UNAUTHORIZED);
      return;
    }

    Object.assign(user, req.body);
    await user.save();

    const userObj = user.toObject() as unknown as Record<string, unknown>;
    delete userObj.password;

    successResponse(res, userObj, "Profil mis à jour avec succès");
  } catch (error) {
    next(error);
  }
}
