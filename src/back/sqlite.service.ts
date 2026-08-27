import Database from "better-sqlite3";
import { DatasourceDto } from "../commons/data/dto/datasource-dto";
import { CreateDatasourceFormDto } from "../commons/data/dto/forms/create-datasource-form-dto";
import PostgresqlService from "./postgresql.service";
import { safeStorage, app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

const APP_DATA_DIR = 'dba-app';

export class SqliteService {

    private static getDatabasePath(): string {
        const userDataPath = app.getPath('userData');
        return path.join(userDataPath, 'app.db');
    }

    private static getDatabase(): Database {
        return new Database(SqliteService.getDatabasePath());
    }

    /**
     * Initialise le dossier de données et la base SQLite
     * @throws {Error} Si le dossier ne peut pas être créé
     */
    public static init(): void {
        const userDataPath = app.getPath('userData');
        const appDataDir = path.join(userDataPath, APP_DATA_DIR);

        if (!fs.existsSync(appDataDir)) {
            try {
                fs.mkdirSync(appDataDir, { recursive: true });
                console.log(`Dossier de données créé: ${appDataDir}`);
            } catch (err) {
                console.error(`\u274c ERREUR CRITIQUE: Impossible de créer le dossier de données: ${err}`);
                throw new Error(
                    'Impossible de créer le dossier de stockage des données. ' +
                    'Vérifiez les permissions d\'écriture dans le dossier utilisateur.'
                );
            }
        }

        const db = this.getDatabase();

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

        console.log('Database connected successfully');
    }

    public static getDatasources(): Promise<DatasourceDto[]> {
        const db = this.getDatabase();

        try {
            const rows = db.prepare("SELECT * FROM datasource").all() as any[];

            if (!rows || rows.length === 0) {
                return Promise.resolve([]);
            }

            const datasources = rows.map((row: any) => {
                const decryptedPassword = safeStorage.decryptString(row.password);
                return new DatasourceDto(
                    row.id,
                    row.name,
                    row.username,
                    decryptedPassword,
                    row.hostname,
                    row.port,
                    row.dbname
                );
            });

            return Promise.resolve(datasources);
        } catch (err) {
            console.error('Error fetching datasources:', err);
            return Promise.reject(new Error('Failed to fetch datasources'));
        }
    }

    static getDatasourceById(datasourceId: string): Promise<DatasourceDto | null> {
        const id = Number.parseInt(datasourceId);

        if (isNaN(id) || id <= 0) {
            return Promise.resolve(null);
        }

        const db = this.getDatabase();

        try {
            const row = db.prepare("SELECT * FROM datasource WHERE id = ?").get(id) as any;

            if (!row) {
                return Promise.resolve(null);
            }

            const decryptedPassword = safeStorage.decryptString(row.password);
            return Promise.resolve(new DatasourceDto(
                row.id,
                row.name,
                row.username,
                decryptedPassword,
                row.hostname,
                row.port,
                row.dbname
            ));
        } catch (err) {
            console.error('Error fetching datasource by ID:', err);
            return Promise.reject(new Error('Failed to fetch datasource'));
        }
    }

    static async createDatasource(args: any): Promise<void> {
        const form = args["form"] as CreateDatasourceFormDto;

        const db = this.getDatabase();

        try {
            await PostgresqlService.testConnection(form);

            const existingDatasources = await this.getDatasources();
            if(existingDatasources.find(d => d.name == form.name
                || (d.hostname === form.hostname && d.dbname === form.dbname && d.username === form.username && d.port === form.port))) {
                throw new Error("A datasource already exists with these informations!");
            }

            const encryptedPassword = safeStorage.encryptString(form.password);

            const stmt = db.prepare(
                `INSERT INTO datasource (name, username, password, hostname, port, dbname)
                 VALUES (?, ?, ?, ?, ?, ?)`
            );

            stmt.run(
                form.name,
                form.username,
                encryptedPassword,
                form.hostname,
                form.port,
                form.dbname
            );

            console.log("success");
        } catch (err) {
            const message = (err as any)?.message;
            console.error('Error creating datasource:', err);
            throw new Error(`Failed to create datasource${message ? ' : ' + message : ''}`);
        }
    }

    static async deleteDatasource(args: any): Promise<void> {
        const datasourceId = args.datasourceId;
        const id = Number.parseInt(datasourceId);

        if (isNaN(id) || id <= 0) {
            throw new Error('Invalid datasource ID');
        }

        const db = this.getDatabase();

        try {
            db.prepare("DELETE FROM datasource WHERE id = ?").run(id);
        } catch (err) {
            console.error('Error deleting datasource:', err);
            throw new Error('Failed to delete datasource');
        }
    }

    static async updateDatasource(args: any): Promise<void> {
        const { id, form } = args;
        const datasourceId = Number.parseInt(id);

        if (isNaN(datasourceId) || datasourceId <= 0) {
            throw new Error('Invalid datasource ID');
        }

        const db = this.getDatabase();

        try {
            // Chiffrer le nouveau mot de passe
            const encryptedPassword = safeStorage.encryptString(form.password);

            // Requte param9tre pour 9viter l'injection SQL
            db.prepare(
                `UPDATE datasource
                 SET name = ?, username = ?, password = ?, hostname = ?, port = ?, dbname = ?
                 WHERE id = ?`
            ).run(
                form.name,
                form.username,
                encryptedPassword,
                form.hostname,
                form.port,
                form.dbname,
                datasourceId
            );
        } catch (err) {
            console.error('Error updating datasource:', err);
            throw new Error('Failed to update datasource');
        }
    }
}
