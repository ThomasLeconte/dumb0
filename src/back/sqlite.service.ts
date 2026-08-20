import {Database} from "sqlite3";
import {DatasourceDto} from "../commons/data/dto/datasource-dto";

import * as sqlite from "node:sqlite";
import {CreateDatasourceFormDto} from "../commons/data/dto/forms/create-datasource-form-dto";
import PostgresqlService from "./postgresql.service";

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
                    new DatasourceDto(row['id'], row['name'], row['username'], row['password'], row['hostname'], row['port'], row['dbname']);
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

                resolve(new DatasourceDto(row['id'], row['name'], row['username'], row['password'], row['hostname'], row['port'], row['dbname']));
            })
        })
    }

    static async createDatasource(args: any) {
        const form = args["form"] as CreateDatasourceFormDto;

        const db = this.getDatabase();

        return new Promise((resolve, reject) => {
            PostgresqlService.testConnection(form)
                .then(() => {
                    db.exec(`INSERT INTO datasource (name, username, password, hostname, port, dbname)
                          VALUES ('${form.name}', '${form.username}', '${form.password}', '${form.hostname}', ${form.port}, '${form.dbname}');`, (err) => {
                        if(err) reject(err);

                        resolve(null);
                    });
                })
                .catch((err) => {
                reject(err);
            });
        })
    }
}
