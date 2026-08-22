import { Database } from "sqlite3";
import { DatasourceDto } from "../commons/data/dto/datasource-dto";
import { CreateDatasourceFormDto } from "../commons/data/dto/forms/create-datasource-form-dto";
import PostgresqlService from "./postgresql.service";
import { safeStorage, app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

// Nom du dossier pour stocker les données de l'application
const APP_DATA_DIR = 'dba-app';

export class SqliteService {

    private static getDatabasePath(): string {
        // Chemin vers le dossier des données utilisateur + notre sous-dossier
        const userDataPath = app.getPath('userData');
        const appDataDir = path.join(userDataPath, APP_DATA_DIR);
        return path.join(appDataDir, 'app.db');
    }

    private static getDatabase(): Database {
        const { Database } = require('sqlite3');
        return new Database(SqliteService.getDatabasePath());
    }

    /**
     * Initialise le dossier de données et la base SQLite
     * @throws {Error} Si le dossier ne peut pas être créé
     */
    public static init(): void {
        const userDataPath = app.getPath('userData');
        const appDataDir = path.join(userDataPath, APP_DATA_DIR);

        // Vérifier si le dossier existe, sinon le créer
        if (!fs.existsSync(appDataDir)) {
            try {
                fs.mkdirSync(appDataDir, { recursive: true });
                console.log(`Dossier de données créé: ${appDataDir}`);
            } catch (err) {
                console.error(`❌ ERREUR CRITIQUE: Impossible de créer le dossier de données: ${err}`);
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

        console.log('Database connected successfully');
    }

    public static getDatasources() {
        const db = this.getDatabase();

        return new Promise<DatasourceDto[]>((resolve, reject) => {
            db.all("SELECT * FROM datasource", (err, rows) => {
                if (err) {
                    console.error('Error fetching datasources:', err);
                    reject(new Error('Failed to fetch datasources'));
                    return;
                }
                
                if (!rows || rows.length === 0) {
                    resolve([]);
                    return;
                }

                const datasources = rows.map((row: any) => {
                    // Déchiffrer le mot de passe avant de créer le DTO
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

                resolve(datasources);
            });
        });
    }

    static getDatasourceById(datasourceId: string): Promise<DatasourceDto | null> {
        const id = Number.parseInt(datasourceId);
        
        // Validation de l'ID
        if (isNaN(id) || id <= 0) {
            return Promise.resolve(null);
        }

        const db = this.getDatabase();

        return new Promise<DatasourceDto | null>((resolve, reject) => {
            // Requête paramétrée pour éviter l'injection SQL
            db.get("SELECT * FROM datasource WHERE id = ?", [id], (err, row) => {
                if (err) {
                    console.error('Error fetching datasource by ID:', err);
                    reject(new Error('Failed to fetch datasource'));
                    return;
                }
                
                if (!row) {
                    resolve(null);
                    return;
                }

                // Déchiffrer le mot de passe
                const decryptedPassword = safeStorage.decryptString(row.password);
                resolve(new DatasourceDto(
                    row.id,
                    row.name,
                    row.username,
                    decryptedPassword,
                    row.hostname,
                    row.port,
                    row.dbname
                ));
            });
        });
    }

    static async createDatasource(args: any) {
        const form = args["form"] as CreateDatasourceFormDto;

        const db = this.getDatabase();

        return new Promise<void>((resolve, reject) => {
            PostgresqlService.testConnection(form)
                .then(() => {
                    // Chiffrer le mot de passe avant stockage
                    const encryptedPassword = safeStorage.encryptString(form.password);
                    
                    // Requête paramétrée pour éviter l'injection SQL
                    db.exec(
                        `INSERT INTO datasource (name, username, password, hostname, port, dbname)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            form.name,
                            form.username,
                            encryptedPassword,
                            form.hostname,
                            form.port,
                            form.dbname
                        ],
                        (err) => {
                            if (err) {
                                console.error('Error creating datasource:', err);
                                reject(new Error('Failed to create datasource'));
                                return;
                            }
                            resolve();
                        }
                    );
                })
                .catch((err) => {
                    console.error('Connection test failed:', err);
                    reject(new Error('Connection test failed'));
                });
        });
    }

    static async deleteDatasource(args: any) {
        const datasourceId = args.datasourceId;
        const id = Number.parseInt(datasourceId);
        
        // Validation de l'ID
        if (isNaN(id) || id <= 0) {
            throw new Error('Invalid datasource ID');
        }

        const db = this.getDatabase();

        return new Promise<void>((resolve, reject) => {
            // Requête paramétrée pour éviter l'injection SQL
            db.exec("DELETE FROM datasource WHERE id = ?", [id], (err) => {
                if (err) {
                    console.error('Error deleting datasource:', err);
                    reject(new Error('Failed to delete datasource'));
                    return;
                }
                resolve();
            });
        });
    }

    static async updateDatasource(args: any) {
        const { id, form } = args;
        const datasourceId = Number.parseInt(id);
        
        // Validation de l'ID
        if (isNaN(datasourceId) || datasourceId <= 0) {
            throw new Error('Invalid datasource ID');
        }

        const db = this.getDatabase();

        return new Promise<void>((resolve, reject) => {
            // Chiffrer le nouveau mot de passe
            const encryptedPassword = safeStorage.encryptString(form.password);
            
            // Requête paramétrée pour éviter l'injection SQL
            db.exec(
                `UPDATE datasource 
                 SET name = ?, username = ?, password = ?, hostname = ?, port = ?, dbname = ?
                 WHERE id = ?`,
                [
                    form.name,
                    form.username,
                    encryptedPassword,
                    form.hostname,
                    form.port,
                    form.dbname,
                    datasourceId
                ],
                (err) => {
                    if (err) {
                        console.error('Error updating datasource:', err);
                        reject(new Error('Failed to update datasource'));
                        return;
                    }
                    resolve();
                }
            );
        });
    }
}
