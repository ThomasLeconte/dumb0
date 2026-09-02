import type { Migration } from "./types";

export const addParametersMigrations: Migration = {
    version: 2,
    description: "Add parameters table",

    up: (db) => {
        db.exec(`
      CREATE TABLE IF NOT EXISTS parameters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code VARCHAR(255) NOT NULL UNIQUE,
        "value" TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    },
};
