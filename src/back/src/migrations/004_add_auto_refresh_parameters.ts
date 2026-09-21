import type { Migration } from "./types.js";

export const addAutoRefreshParameters: Migration = {
  version: 4,
  description: "Add AUTO_REFRESH and AUTO_REFRESH_INTERVAL parameters",

  up: (db) => {
    // Insert AUTO_REFRESH parameter (default: false)
    db.exec(`
      INSERT INTO parameters(code, "value") 
      VALUES ('AUTO_REFRESH', 'false')
      ON CONFLICT(code) DO NOTHING
    `);

    // Insert AUTO_REFRESH_INTERVAL parameter (default: 5000ms)
    db.exec(`
      INSERT INTO parameters(code, "value") 
      VALUES ('AUTO_REFRESH_INTERVAL', '5000')
      ON CONFLICT(code) DO NOTHING
    `);
  }
};
