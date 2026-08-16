import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import { StatusCodes } from "http-status-codes";
import { errorResponse } from "./utils/responseFormatter.js";
import { isAllowedOrigin } from "./config/cors.js";
import menuCategoryRouter from "./routes/menuCategory.routes.js";
import menuExtraTypeRouter from "./routes/menuExtraType.routes.js";
import menuExtraRouter from "./routes/menuExtra.routes.js";
import menuItemRouter from "./routes/menuItem.routes.js";
import orderRouter from "./routes/order.routes.js";
import tableRouter from "./routes/table.routes.js";
import uploadRouter from "./routes/upload.routes.js";

const app = express();

// middlewares
// Obligatoire derrière le proxy de Render : sans ça, req.secure reste false et
// Express refuse de poser un cookie secure:true en production.
app.set("trust proxy", true);

// CORS : liste d'origines (voir config/cors.ts) plutôt qu'une seule valeur —
// le front a au minimum une URL en local et une en production, plus les
// previews Vercel qui changent à chaque déploiement.
// credentials:true est ce qui autorise le navigateur à transporter le cookie.
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origine non autorisée par CORS : ${origin}`));
      }
    },
  }),
);

app.use(helmet());

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Doit précéder les routes : c'est lui qui remplit req.cookies, lu par CheckAuth.
app.use(cookieParser());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// routes
app.use("/auth", authRouter);
app.use("/menu-categories", menuCategoryRouter);
app.use("/menu-extra-types", menuExtraTypeRouter);
app.use("/menu-extras", menuExtraRouter);
app.use("/menu-items", menuItemRouter);
app.use("/tables", tableRouter);
app.use("/orders", orderRouter);
app.use("/upload", uploadRouter);

// route de test
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// not found route
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// error route
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);

    // Erreur de duplication (ex: name unique déjà pris)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      errorResponse(res, `Ce ${field} existe déjà`, StatusCodes.CONFLICT, field);
      return;
    }

    // Erreur de validation Mongoose (ex: required manquant, mauvais type)
    if (err.name === "ValidationError") {
      const firstError = Object.values(err.errors)[0] as { message: string };
      errorResponse(res, firstError.message, StatusCodes.BAD_REQUEST);
      return;
    }

    // Erreur métier custom avec statusCode explicite (ex: resolveOrderItemsPricing)
    if (err.statusCode && typeof err.statusCode === "number") {
      errorResponse(res, err.message, err.statusCode);
      return;
    }

    // Token JWT invalide ou expiré (jwt.verify() dans CheckAuth)
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      errorResponse(
        res,
        err.name === "TokenExpiredError"
          ? "Session expirée, veuillez vous reconnecter"
          : "Token invalide",
        StatusCodes.UNAUTHORIZED,
      );
      return;
    }

    // Erreur générique / inconnue
    errorResponse(
      res,
      "Erreur interne du serveur",
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  },
);

export default app;
