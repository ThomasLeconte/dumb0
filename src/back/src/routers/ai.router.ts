import { Router } from "express";
import { AiService } from "../services/ai.service.js";
import { asyncHandler } from "./async-handler.js";
import { requireBodyFields } from "./validation.js";

export const aiRouter = Router();

// Analyse d'une requête (réponse complète, non streamée)
aiRouter.post(
  "/analyze",
  asyncHandler(async (req, res) => {
    requireBodyFields(req.body, ["query"]);
    const { query, datasourceId } = req.body as { query: string; datasourceId?: string };
    const args: { query: string; datasourceId?: string } = { query };
    if (datasourceId !== undefined) args.datasourceId = datasourceId;
    res.json(await AiService.analyzeQuery(args));
  }),
);

// Analyse d'une requête en streaming (Server-Sent Events)
aiRouter.post("/analyze-stream", (req, res) => {
  requireBodyFields(req.body, ["query", "requestId"]);
  const { query, datasourceId, requestId } = req.body as {
    query: string;
    datasourceId?: string;
    requestId: string;
  };

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Annulation côté client : on stoppe le stream
  const onClose = () => AiService.cancelStream(requestId);
  req.on("close", onClose);

  const streamArgs: { query: string; datasourceId?: string } = { query };
  if (datasourceId !== undefined) streamArgs.datasourceId = datasourceId;

  AiService.startStream(
    requestId,
    streamArgs,
    (chunk) => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    },
  )
    .then(() => {
      res.write(`event: end\ndata: {}\n\n`);
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
    })
    .finally(() => {
      req.off("close", onClose);
      res.end();
    });
});

// Annulation explicite d'un stream en cours
aiRouter.post(
  "/cancel-stream",
  asyncHandler(async (req, res) => {
    requireBodyFields(req.body, ["requestId"]);
    const { requestId } = req.body as { requestId: string };
    AiService.cancelStream(requestId);
    res.json({ success: true });
  }),
);
