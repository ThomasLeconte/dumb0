import { Database } from "better-sqlite3";
import type { Migration } from "./types";
import { initialSchema } from "./001_initial_schema";
import {addParametersMigrations} from "./002_add_parameters_table";

const migrations: Migration[] = [
    initialSchema,
    addParametersMigrations
];

export class MigrationRunner {
  static run(db: Database): void {
    MigrationRunner.ensureMigrationsTable(db);

    const appliedVersions = MigrationRunner.getAppliedVersions(db);

    for (const migration of migrations) {
      if (!appliedVersions.has(migration.version)) {
        const runMigration = db.transaction(() => {
          migration.up(db);
          db.prepare(
            "INSERT INTO migrations (version, description) VALUES (?, ?)"
          ).run(migration.version, migration.description);
        });
        runMigration();
        console.log(`[migrations] Applied ${migration.version}: ${migration.description}`);
      }
    }
  }

  private static ensureMigrationsTable(db: Database): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        description TEXT,
        executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private static isFreshInstall(db: Database): boolean {
    const count = db.prepare("SELECT COUNT(*) as count FROM migrations").get() as { count: number };
    return count.count === 0;
  }

  private static getAppliedVersions(db: Database): Set<number> {
    const rows = db.prepare("SELECT version FROM migrations").all() as { version: number }[];
    return new Set(rows.map(row => row.version));
  }

  private static tablesAlreadyExist(db: Database): boolean {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'datasource'")
      .get() as { name: string } | undefined;
    return row !== undefined;
  }
}
