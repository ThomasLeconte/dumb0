import type { Migration } from "./types";

export const addSchemaToDatasource: Migration = {
  version: 3,
  description: "Add schema field to datasource table",

  up: (db) => {
    db.exec(`
      ALTER TABLE datasource ADD COLUMN schema TEXT NOT NULL DEFAULT 'public'
    `);
  }
};
