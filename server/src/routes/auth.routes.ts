import { Router } from "express";
import {
  checkUser,
  login,
  logout,
  register,
  getUsers,
  getDeliveryPersons,
  updateUser,
  updateOwnProfile,
  deleteUser,
} from "../controllers/auth.controller.js";
import { CheckAuth, isAdmin, isStaff } from "../middlewares/auth.js";
import {
  validateBodySchema,
  validateQuerySchema,
} from "../middlewares/validations.js";
import {
  loginSchema,
  registerSchema,
  updateUserSchema,
  updateProfileSchema,
  usersQuerySchema,
} from "../validation/user.js";
import { loginLimiter } from "../middlewares/rateLimiters.js";

const authRouter = Router();

authRouter.get("/", CheckAuth, checkUser);

authRouter.post("/login", loginLimiter, validateBodySchema(loginSchema), login);

// Volontairement sans CheckAuth : un token expiré doit quand même pouvoir
// nettoyer le cookie. Exiger une session valide pour se déconnecter laisserait
// un cookie mort dans le navigateur, et l'utilisateur coincé sur /login.
authRouter.post("/logout", logout);

// Réservé à l'admin : seul l'admin modifie les infos des comptes, le sien
// compris. Un employé ou un livreur demande la correction à l'admin, qui passe
// par PATCH /users/:id. Restreint aux infos de contact : ne jamais autoriser
// role/store ici (voir updateOwnProfile côté contrôleur).
authRouter.patch(
  "/me",
  CheckAuth,
  isAdmin,
  validateBodySchema(updateProfileSchema),
  updateOwnProfile,
);

// Route STATIQUE avant "/users/:id" : sinon "delivery-persons" serait capturé
// comme un identifiant. Accessible à tout le staff, contrairement à
// GET /users — c'est l'employé au comptoir qui assigne les courses.
authRouter.get("/delivery-persons", CheckAuth, isStaff, getDeliveryPersons);

authRouter.post(
  "/register",
  CheckAuth,
  isAdmin,
  validateBodySchema(registerSchema),
  register,
);

// Gestion des comptes staff depuis le dashboard (admin uniquement)
authRouter.get(
  "/users",
  CheckAuth,
  isAdmin,
  validateQuerySchema(usersQuerySchema),
  getUsers,
);
authRouter.patch(
  "/users/:id",
  CheckAuth,
  isAdmin,
  validateBodySchema(updateUserSchema),
  updateUser,
);
authRouter.delete("/users/:id", CheckAuth, isAdmin, deleteUser);

export default authRouter;
