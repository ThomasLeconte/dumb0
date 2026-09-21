import { Router } from "express";
import PostgresqlService from "../services/postgresql.service.js";
import { asyncHandler } from "./async-handler.js";
import { requireParam } from "./validation.js";

export const tableRouter = Router();

// Liste des tables d'une datasource
tableRouter.get(
  "/:datasourceId",
  asyncHandler(async (req, res) => {
    const datasourceId = requireParam(req.params, "datasourceId");
    res.json(await PostgresqlService.getTables({ datasourceId }));
  }),
);

// Statistiques d'une table d'une datasource
tableRouter.get(
  "/:datasourceId/:tableName/stats",
  asyncHandler(async (req, res) => {
    const datasourceId = requireParam(req.params, "datasourceId");
    const tableName = requireParam(req.params, "tableName");
    res.json(await PostgresqlService.getTableStats({ tableName, datasourceId }));
  }),
);
