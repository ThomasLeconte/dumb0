import { DatabaseSync } from "node:sqlite";
import type { Migration } from "./types.js";
import { initialSchema } from "./001_initial_schema.js";
import {addParametersMigrations} from "./002_add_parameters_table.js";
import { addSchemaToDatasource } from "./003_add_schema_to_datasource.js";
import { addAutoRefreshParameters } from "./004_add_auto_refresh_parameters.js";
import {addTelemetryParameter} from "./005_add_telemetry_parameter.js";

const migrations: Migration[] = [
    initialSchema,
    addParametersMigrations,
    addSchemaToDatasource,
    addAutoRefreshParameters,
    addTelemetryParameter
];

export class MigrationRunner {
  static run(db: DatabaseSync): void {
    MigrationRunner.ensureMigrationsTable(db);

    const appliedVersions = MigrationRunner.getAppliedVersions(db);

    for (const migration of migrations) {
      if (!appliedVersions.has(migration.version)) {
        db.exec('BEGIN');
        try {
          migration.up(db);
          db.prepare(
            "INSERT INTO migrations (version, description) VALUES (?, ?)"
          ).run(migration.version, migration.description);
          db.exec('COMMIT');
        } catch (err) {
          db.exec('ROLLBACK');
          throw err;
        }
        console.log(`[migrations] Applied ${migration.version}: ${migration.description}`);
      }
    }
  }

  private static ensureMigrationsTable(db: DatabaseSync): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        description TEXT,
        executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private static isFreshInstall(db: DatabaseSync): boolean {
    const count = db.prepare("SELECT COUNT(*) as count FROM migrations").get() as { count: number };
    return count.count === 0;
  }

  private static getAppliedVersions(db: DatabaseSync): Set<number> {
    const rows = db.prepare("SELECT version FROM migrations").all() as { version: number }[];
    return new Set(rows.map(row => row.version));
  }

  private static tablesAlreadyExist(db: DatabaseSync): boolean {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'datasource'")
      .get() as { name: string } | undefined;
    return row !== undefined;
  }
}
