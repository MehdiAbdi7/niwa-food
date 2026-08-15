import { Router } from "express";
import {
  createTable,
  getTables,
  getPublicTables,
  updateTable,
  freeTable,
  deleteTable,
} from "../controllers/table.controller.js";
import { CheckAuth, isAdmin } from "../middlewares/auth.js";
import {
  validateBodySchema,
  validateQuerySchema,
} from "../middlewares/validations.js";
import {
  createTableSchema,
  updateTableSchema,
  tablesQuerySchema,
  publicTablesQuerySchema,
} from "../validation/table.js";

const tableRouter = Router();

// Route statique publique AVANT les routes protégées (même convention que order.routes.ts)
tableRouter.get(
  "/public",
  validateQuerySchema(publicTablesQuerySchema),
  getPublicTables,
);

tableRouter.get(
  "/",
  CheckAuth,
  validateQuerySchema(tablesQuerySchema),
  getTables,
);

// Accessible au staff : débloquer une table en salle ne doit pas dépendre de l'admin
tableRouter.patch("/:id/free", CheckAuth, freeTable);

tableRouter.post(
  "/",
  CheckAuth,
  isAdmin,
  validateBodySchema(createTableSchema),
  createTable,
);
tableRouter.put(
  "/:id",
  CheckAuth,
  isAdmin,
  validateBodySchema(updateTableSchema),
  updateTable,
);
tableRouter.delete("/:id", CheckAuth, isAdmin, deleteTable);

export default tableRouter;
