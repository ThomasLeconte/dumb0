import type { Migration } from "./types.js";

export const initialSchema: Migration = {
  version: 1,
  description: "Initial schema: datasource, query_history, saved_query",

  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS datasource (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        hostname TEXT NOT NULL,
        port INTEGER NOT NULL,
        dbname TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS query_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        datasource_id INTEGER NOT NULL,
        query TEXT NOT NULL,
        executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (datasource_id) REFERENCES datasource(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS saved_query (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        datasource_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        query TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (datasource_id) REFERENCES datasource(id) ON DELETE CASCADE
      )
    `);
  },
};
