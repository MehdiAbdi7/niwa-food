import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRouter from "./routes/auth.routes.js";
import { StatusCodes } from "http-status-codes";
import { errorResponse } from "./utils/responseFormatter.js";
import menuCategoryRouter from "./routes/menuCategory.routes.js";
import menuExtraTypeRouter from "./routes/menuExtraType.routes.js";
import menuExtraRouter from "./routes/menuExtra.routes.js";
import menuItemRouter from "./routes/menuItem.routes.js";
import orderRouter from "./routes/order.routes.js";
import tableRouter from "./routes/table.routes.js";
import uploadRouter from "./routes/upload.routes.js";

const app = express();

// middlewares
app.set("trust proxy", true);

app.use(
  cors({
    credentials: true,
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  }),
);

app.use(helmet());

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

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
      errorResponse(
        res,
        `Ce ${field} existe déjà`,
        StatusCodes.CONFLICT,
        field,
      );
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
