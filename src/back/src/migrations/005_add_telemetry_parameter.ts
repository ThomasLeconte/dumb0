import type { Migration } from "./types.js";

export const addTelemetryParameter: Migration = {
    version: 5,
    description: "Add TELEMETRY and AUTO_REFRESH_INTERVAL parameter",

    up: (db) => {
        // Insert AUTO_REFRESH parameter (default: false)
        db.exec(`
      INSERT INTO parameters(code, "value") 
      VALUES ('TELEMETRY', 'false')
      ON CONFLICT(code) DO NOTHING
    `);
    }
};
