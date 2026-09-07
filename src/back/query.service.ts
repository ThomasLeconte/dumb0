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
        // Normaliser la requête pour la validation (supprimer les commentaires et les espaces multiples)
        const cleanedQuery = query
            .replace(/--.*?$|\/\*[\s\S]*?\*\//gm, '') // Supprimer les commentaires SQL
            .trim()
            .toUpperCase();

        // Liste des mots-clés dangereux à bloquer (case-insensitive)
        const forbiddenKeywords = [
            // Requêtes de suppression
            'DROP', 'TRUNCATE', 'DELETE FROM',
            
            // Requêtes de modification de structure
            'ALTER TABLE', 'ALTER DATABASE', 'ALTER SYSTEM',
            
            // Requêtes de modification de données
            'UPDATE', 'INSERT INTO',
            
            // Requêtes d'administration système
            'SHUTDOWN', 'RESTART', 'RELOAD',
            
            // Requêtes de permissions
            'GRANT', 'REVOKE', 'CREATE ROLE', 'ALTER ROLE', 'DROP ROLE',
            'CREATE USER', 'ALTER USER', 'DROP USER', 'CREATE GROUP', 'ALTER GROUP', 'DROP GROUP',
            
            // Requêtes de configuration
            'SET PASSWORD', 'SET ROLE', 'SET SESSION_AUTHORIZATION',
            
            // Requêtes de réplication
            'CREATE REPLICATION SLOT', 'DROP REPLICATION SLOT',
            
            // Requêtes de tablespace
            'CREATE TABLESPACE', 'ALTER TABLESPACE', 'DROP TABLESPACE',
            
            // Requêtes de base de données
            'CREATE DATABASE', 'ALTER DATABASE', 'DROP DATABASE',
            
            // Requêtes de extension
            'DROP EXTENSION', 'CREATE EXTENSION',
            
            // Requêtes de language
            'DROP LANGUAGE', 'CREATE LANGUAGE',
            
            // Requêtes de collation
            'DROP COLLATION', 'CREATE COLLATION',
            
            // Requêtes de conversion
            'DROP CONVERSION', 'CREATE CONVERSION',
            
            // Requêtes d'opérateur
            'DROP OPERATOR', 'CREATE OPERATOR',
            
            // Requêtes de type
            'DROP TYPE', 'CREATE TYPE',
            
            // Requêtes de domaine
            'DROP DOMAIN', 'CREATE DOMAIN',
            
            // Requêtes de schéma
            'CREATE SCHEMA', 'DROP SCHEMA', 'ALTER SCHEMA',
            
            // Requêtes de fonction
            'CREATE FUNCTION', 'DROP FUNCTION', 'ALTER FUNCTION',
            
            // Requêtes de trigger
            'CREATE TRIGGER', 'DROP TRIGGER',
            
            // Requêtes de vue
            'CREATE VIEW', 'DROP VIEW',
            
            // Requêtes de séquence
            'CREATE SEQUENCE', 'DROP SEQUENCE', 'ALTER SEQUENCE',
            
            // Requêtes de table
            'CREATE TABLE', 'DROP TABLE',
            
            // Requêtes de index
            'CREATE INDEX', 'DROP INDEX',
            
            // Requêtes avec des sous-requêtes de modification
            'WITH', ';',
        ];

        // Vérifier si la requête contient un mot-clé interdit
        for (const keyword of forbiddenKeywords) {
            // Vérifier au début de la requête ou après un espace/parenthèse
            if (cleanedQuery.includes(` ${keyword} `) || 
                cleanedQuery.startsWith(keyword + ' ') ||
                cleanedQuery.startsWith(keyword + '(') ||
                cleanedQuery.includes(`(${keyword} `) ||
                cleanedQuery.includes(` ${keyword}(`)) {
                return false;
            }
        }

        // Autoriser uniquement les requêtes SELECT de base (sans sous-requêtes complexes)
        // On vérifie que la requête commence bien par SELECT
        if (!cleanedQuery.startsWith('SELECT ')) {
            return false;
        }

        // Bloquer les SELECT avec des sous-requêtes de modification
        if (cleanedQuery.includes(' WITH ') || cleanedQuery.includes('(SELECT')) {
            return false;
        }

        return true;
    }
}
