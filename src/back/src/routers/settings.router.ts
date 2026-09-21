import { Router } from "express";
import { ParametersService } from "../services/parameters.service.js";
import { asyncHandler } from "./async-handler.js";
import { requireBodyFields } from "./validation.js";

export const settingsRouter = Router();

// Tous les paramètres
settingsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await ParametersService.getAll());
  }),
);

// Mettre à jour un paramètre
settingsRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    requireBodyFields(req.body, ["code"]);
    const { code, value } = req.body as { code: string; value: unknown };
    ParametersService.updateParameterByCode({ code, value });
    res.json({ success: true });
  }),
);

// Pays disponibles (langage IA par défaut)
settingsRouter.get(
  "/countries",
  asyncHandler(async (_req, res) => {
    res.json(await ParametersService.getAvailableCountries());
  }),
);
