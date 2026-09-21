import { Router } from "express";
import { SqliteService } from "../services/sqlite.service.js";
import PostgresqlService from "../services/postgresql.service.js";
import { QueryService } from "../services/query.service.js";
import { asyncHandler } from "./async-handler.js";
import {
  requireBodyFields,
  requireNumericParam,
  requireParam,
  optionalNumericQuery,
} from "./validation.js";

export const datasourceRouter = Router();

// Datasources CRUD
datasourceRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await SqliteService.getDatasources());
  }),
);

datasourceRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    requireBodyFields(req.body, ["name", "hostname", "port", "dbname", "username", "password"]);
    await SqliteService.createDatasource({ form: req.body });
    res.status(201).json({ success: true });
  }),
);

datasourceRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    requireParam(req.params, "id");
    requireBodyFields(req.body, ["name", "hostname", "port", "dbname", "username", "password"]);
    await SqliteService.updateDatasource({ id: req.params.id, form: req.body });
    res.json({ success: true });
  }),
);

datasourceRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    requireParam(req.params, "id");
    await SqliteService.deleteDatasource({ datasourceId: req.params.id });
    res.json({ success: true });
  }),
);

// Stats globales d'une datasource (côté PostgreSQL)
datasourceRouter.get(
  "/:id/stats",
  asyncHandler(async (req, res) => {
    const datasourceId = requireParam(req.params, "id");
    res.json(await PostgresqlService.getDatasourceStats({ datasourceId }));
  }),
);

// Exécution de requête
datasourceRouter.post(
  "/:id/query",
  asyncHandler(async (req, res) => {
    const datasourceId = requireParam(req.params, "id");
    requireBodyFields(req.body, ["query"]);
    res.json(await QueryService.executeQuery({ datasourceId, query: req.body.query as string }));
  }),
);

// Historique des requêtes
datasourceRouter.get(
  "/:id/query-history",
  asyncHandler(async (req, res) => {
    const datasourceId = requireParam(req.params, "id");
    const limit = optionalNumericQuery(req.query, "limit");
    const args: { datasourceId: string; limit?: number } = { datasourceId };
    if (limit !== undefined) args.limit = limit;
    res.json(await QueryService.getQueryHistory(args));
  }),
);

datasourceRouter.delete(
  "/query-history/:id",
  asyncHandler(async (req, res) => {
    const id = requireNumericParam(req.params, "id");
    res.json(await QueryService.deleteQueryHistory({ id }));
  }),
);

// Requêtes sauvegardées
datasourceRouter.get(
  "/:id/saved-queries",
  asyncHandler(async (req, res) => {
    const datasourceId = requireParam(req.params, "id");
    const limit = optionalNumericQuery(req.query, "limit");
    const args: { datasourceId: string; limit?: number } = { datasourceId };
    if (limit !== undefined) args.limit = limit;
    res.json(await QueryService.getSavedQueries(args));
  }),
);

datasourceRouter.post(
  "/:id/saved-queries",
  asyncHandler(async (req, res) => {
    requireParam(req.params, "id");
    requireBodyFields(req.body, ["name", "query"]);
    res.json(await QueryService.saveQuery({ form: req.body }));
  }),
);

datasourceRouter.put(
  "/saved-queries/:id",
  asyncHandler(async (req, res) => {
    const id = requireNumericParam(req.params, "id");
    requireBodyFields(req.body, ["name", "query"]);
    const { name, query } = req.body as { name: string; query: string };
    res.json(await QueryService.updateQuery({ id, name, query }));
  }),
);

datasourceRouter.delete(
  "/saved-queries/:id",
  asyncHandler(async (req, res) => {
    const queryId = requireNumericParam(req.params, "id");
    res.json(await QueryService.deleteQuery({ queryId }));
  }),
);
