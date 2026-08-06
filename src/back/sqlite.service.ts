import {Database} from "sqlite3";
import {DatasourceDto} from "../commons/data/dto/datasource-dto";

import * as sqlite from "node:sqlite";

export class SqliteService {

    private static getDatabase(): Database {
        const {Database} = require('sqlite3');
        return new Database('app.db');
    }

    public static init() {
        const db = this.getDatabase();

        // Enable Write-Ahead Logging for better concurrent read performance
        // This is recommended for most applications
        // db.pragma('journal_mode = WAL');

        // Enable foreign key constraints (disabled by default in SQLite)
        // db.pragma('foreign_keys = ON');

        db.exec(`
            CREATE TABLE IF NOT EXISTS datasource (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                hostname TEXT NOT NULL,
                port INTEGER NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1
            )
        `);

        console.log('Database connected successfully');
    }

    public static getDatasources() {
        const db = this.getDatabase();
        let result: DatasourceDto[] = [];

        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM datasource", (err, rows) => {
                if(err) reject(err);
                if(rows == null || rows.length === 0) resolve(result);

                rows.map((row: any) => {
                    new DatasourceDto(row['id'], row['name'], row['username'], row['password'], row['hostname'], row['port']);
                });

                resolve(rows);
            })
        })
    }

    static getDatasourceById(datasourceId: string): Promise<DatasourceDto> {
        const id = Number.parseInt(datasourceId);
        const db = this.getDatabase();
        let result = null;

        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM datasource where id = ${id}`, (err, row) => {
                if(err) reject(err);
                if(row == null) resolve(result);

                resolve(new DatasourceDto(row['id'], row['name'], row['username'], row['password'], row['hostname'], row['port']));
            })
        })
    }
}
