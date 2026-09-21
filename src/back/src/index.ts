// index.ts
import express, { type ErrorRequestHandler } from "express";
import morgan from "morgan";
import path from "node:path";
import fs from "node:fs";
import { CryptoService } from "./services/crypto.service.js";
import { SqliteService } from "./services/sqlite.service.js";
import { datasourceRouter } from "./routers/datasource.router.js";
import { tableRouter } from "./routers/table.router.js";
import { settingsRouter } from "./routers/settings.router.js";
import { aiRouter } from "./routers/ai.router.js";
import cors from "cors"

const app = express();
const port = process.env.PORT ?? "3000";
app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from your Vue.js app
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  credentials: true // Allow cookies and credentials
}));

// Dossier de stockage des données (clé de chiffrement + base SQLite).
// En Electron, c'est app.getPath('userData') ; ici on prend un dossier serveur.
const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

CryptoService.init(dataDir);
SqliteService.init(dataDir);

app.use(express.json());
app.use(morgan(':method :status :url :res[content-length] - :response-time ms'));

app.use('/api/datasources', datasourceRouter);
app.use('/api/tables', tableRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/ai', aiRouter);

app.get('/', (_req, res) => {
  res.json({ name: 'DUMBØ API', status: 'ok' });
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = (err as { status?: number }).status ?? 500;
  res.status(status).json({
    error: err instanceof Error ? err.message : 'Internal error',
    code: (err as { code?: string }).code,
  });
};
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Dumb0 backend listening on port ${port}`);
});
