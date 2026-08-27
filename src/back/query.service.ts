import {Client, QueryResult} from "pg";
import {SqliteService} from "./sqlite.service";
import {DatasourceDto} from "../commons/data/dto/datasource-dto";
import {CreateQueryFormDto} from "../commons/data/dto/forms/create-query-form-dto";
import {DatasourceSavedQueryDto} from "../commons/data/dto/datasource-saved-query-dto";

export class QueryService {

    static async executeQuery(args: { datasourceId: string; query: string }) {
        const {datasourceId, query} = args;

        // Validation de la datasource
        const datasource = await SqliteService.getDatasourceById(datasourceId);
        if (!datasource) {
            throw new Error("Datasource not found");
        }

        // Validation de la requête
        if (!query || query.trim().length === 0) {
            throw new Error("Query cannot be empty");
        }

        // Vérification des requêtes dangereuses
        if (!this.isSafeQuery(query)) {
            throw new Error("Unsafe query detected: potentially destructive operation");
        }

        const client = await this.initConnection(datasource);

        const startTime = Date.now();
        let queryResult: QueryResult<any>;
        let result;
        return client.query(query)
            .then((res) => {
                queryResult = res;
                result = {
                    success: true,
                    fields: queryResult.fields.map(f => f.name),
                    rows: queryResult.rows,
                    rowCount: queryResult.rowCount,
                    executionTime: Date.now() - startTime,
                };
                return QueryService.saveQueryHistory({datasourceId, query, executedAt: new Date().toISOString()})
            })
            .then(() => {
                return result;
            })
            .catch((err) => {
                console.error('Query execution error:', err);
                return {
                    success: false,
                    error: err.message,
                    code: err.code,
                };
            })
            .finally(() => client.end());
    }

    static async saveQueryHistory(args: {
        datasourceId: string;
        query: string;
        executedAt: string;
    }) {
        const db = SqliteService.getDatabase();
        const { datasourceId, query, executedAt } = args;

        try {
            const stmt = db.prepare(
                `INSERT INTO query_history (datasource_id, query, executed_at)
                 VALUES (?, ?, ?)`
            );
            stmt.run(datasourceId, query, executedAt);
            return { success: true };
        } catch (err) {
            console.error('Error saving query history:', err);
            return { success: false, error: err.message };
        }
    }

    static async getQueryHistory(args: { datasourceId: string; limit?: number }): Promise<{
        id: number;
        query: string;
        executed_at: string;
    }[]> {
        const db = SqliteService.getDatabase();
        const { datasourceId, limit = 50 } = args;

        try {
            const rows = db.prepare(
                `SELECT id, query, executed_at 
                 FROM query_history 
                 WHERE datasource_id = ?
                 ORDER BY executed_at DESC 
                 LIMIT ?`
            ).all(datasourceId, limit) as any[];

            return rows.map(row => ({
                id: row.id,
                query: row.query,
                executed_at: row.executed_at,
            }));
        } catch (err) {
            console.error('Error fetching query history:', err);
            return [];
        }
    }

    static async deleteQueryHistory(args: { id: number }): Promise<{ success: boolean }> {
        const db = SqliteService.getDatabase();
        const { id } = args;

        try {
            db.prepare('DELETE FROM query_history WHERE id = ?').run(id);
            return { success: true };
        } catch (err) {
            console.error('Error deleting query history:', err);
            return { success: false };
        }
    }

    static async getSavedQueries(args: { datasourceId: string; limit?: number }): Promise<DatasourceSavedQueryDto[]> {
        const db = SqliteService.getDatabase();
        const { datasourceId, limit = 50 } = args;

        try {
            const rows = db.prepare(
                `SELECT *
                 FROM saved_query 
                 WHERE datasource_id = ?
                 ORDER BY created_at DESC 
                 LIMIT ?`
            ).all(datasourceId, limit) as any[];

            return rows.map(row => new DatasourceSavedQueryDto(row.id, row.name, row.query));
        } catch (err) {
            console.error('Error fetching saved queries:', err);
            return [];
        }
    }

    static async saveQuery(args: {form: CreateQueryFormDto}) {
        const db = SqliteService.getDatabase();

        try {
            const stmt = db.prepare(
                `INSERT INTO saved_query (datasource_id, query, name)
                 VALUES (?, ?, ?)`
            );
            stmt.run(args.form.datasourceId, args.form.query, args.form.name);
            return { success: true };
        } catch (err) {
            console.error('Error saving query:', err);
            return { success: false, error: err.message };
        }
    }

    static async updateQuery(args: {id: number, query: string, name: string}) {
        const db = SqliteService.getDatabase();

        try {
            const stmt = db.prepare(
                `UPDATE saved_query SET query = ?, name = ? WHERE id = ?`
            );
            stmt.run(args.query, args.name, args.id);
            return { success: true };
        } catch (err) {
            console.error('Error updating query:', err);
            return { success: false, error: err.message };
        }
    }

    static async deleteQuery(args: {queryId: number}) {
        const db = SqliteService.getDatabase();

        try {
            db.prepare('DELETE FROM saved_query WHERE id = ?').run(args.queryId);
            return { success: true };
        } catch (err) {
            console.error('Error deleting query:', err);
            return { success: false };
        }
    }

    private static async initConnection(datasource: DatasourceDto): Promise<Client> {
        const { Client } = require('pg');

        const client = new Client({
            host: datasource.hostname,
            port: datasource.port,
            database: datasource.dbname,
            user: datasource.username,
            password: datasource.password,
            application_name: 'dba-app-query-executor',
            connectionTimeoutMillis: 5000,
            idle_in_transaction_session_timeout: 10000,
        });

        return client.connect();
    }

    private static isSafeQuery(query: string): boolean {
        // Normaliser la requête pour la validation
        const normalizedQuery = query.trim().toUpperCase();

        // Liste des motifs de requêtes dangereuses à bloquer
        const forbiddenPatterns = [
            // Requêtes de suppression
            /^DROP\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW|SEQUENCE|FUNCTION|TRIGGER|ROLE|USER|GROUP)\b/i,
            /^TRUNCATE\s+/i,
            /^DELETE\s+FROM\s+/i,
            
            // Requêtes de modification de structure
            /^ALTER\s+(TABLE|DATABASE|SYSTEM)\b/i,
            
            // Requêtes de modification de données
            /^UPDATE\s+.*\s+SET\s+/i,
            
            // Requêtes d'administration système
            /^SHUTDOWN\b/i,
            /^RESTART\b/i,
            /^RELOAD\b/i,
            
            // Requêtes de permissions
            /^GRANT\s+/i,
            /^REVOKE\s+/i,
            /^CREATE\s+(ROLE|USER|GROUP)\b/i,
            /^ALTER\s+(ROLE|USER|GROUP)\b/i,
            /^DROP\s+(ROLE|USER|GROUP)\b/i,
            
            // Requêtes de configuration
            /^SET\s+(password|role|session_authorization)\b/i,
            
            // Requêtes de réplication
            /^CREATE\s+REPLICATION\s+SLOT\b/i,
            /^DROP\s+REPLICATION\s+SLOT\b/i,
            
            // Requêtes de tablespace
            /^CREATE\s+TABLESPACE\b/i,
            /^ALTER\s+TABLESPACE\b/i,
            /^DROP\s+TABLESPACE\b/i,
            
            // Requêtes de base de données
            /^CREATE\s+DATABASE\b/i,
            /^ALTER\s+DATABASE\b/i,
            /^DROP\s+DATABASE\b/i,
            
            // Requêtes de extension
            /^DROP\s+EXTENSION\b/i,
            
            // Requêtes de language
            /^DROP\s+LANGUAGE\b/i,
            /^CREATE\s+LANGUAGE\b/i,
            
            // Requêtes de collation
            /^DROP\s+COLLATION\b/i,
            /^CREATE\s+COLLATION\b/i,
            
            // Requêtes de conversion
            /^DROP\s+CONVERSION\b/i,
            /^CREATE\s+CONVERSION\b/i,
            
            // Requêtes de opérateur
            /^DROP\s+OPERATOR\b/i,
            /^CREATE\s+OPERATOR\b/i,
            
            // Requêtes de type
            /^DROP\s+TYPE\b/i,
            /^CREATE\s+TYPE\b/i,
            
            // Requêtes de domaine
            /^DROP\s+DOMAIN\b/i,
            /^CREATE\s+DOMAIN\b/i,
        ];

        // Vérifier si la requête commence par un motif interdit
        for (const pattern of forbiddenPatterns) {
            if (pattern.test(normalizedQuery)) {
                return false;
            }
        }

        // Autoriser les requêtes SELECT, INSERT (sans valeurs dangereuses), etc.
        return true;
    }
}
