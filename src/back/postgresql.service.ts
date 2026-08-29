import {Client} from "pg";
import {TableStatsDto} from "../commons/data/dto/table-stats-dto";
import {TableSizeDto} from "../commons/data/dto/table-size-dto";
import {TableRowsStatsDto} from "../commons/data/dto/table-rows-stats-dto";
import {TableLocksDto} from "../commons/data/dto/table-locks-dto";
import {TableIOStatsDto} from "../commons/data/dto/table-io-stats-dto";
import {TableIndexesDto} from "../commons/data/dto/table-indexes-dto";
import {SqliteService} from "./sqlite.service";
import {DatasourceDto} from "../commons/data/dto/datasource-dto";
import {DatasourceLockDto} from "../commons/data/dto/datasource-lock-dto";
import {DatasourceConnectionDto} from "../commons/data/dto/datasource-connection-dto";
import {DatasourceStatsDto} from "../commons/data/dto/datasource-stats-dto";
import {DatasourceMainStatsDto} from "../commons/data/dto/datasource-main-stats-dto";
import {CreateDatasourceFormDto} from "../commons/data/dto/forms/create-datasource-form-dto";

export default class PostgresqlService {

    static async getTables(args: { datasourceId: string }) {
        const datasource = await SqliteService.getDatasourceById(args.datasourceId);
        if (!datasource) {
            return [];
        }

        const client = await PostgresqlService.initConnection(datasource);
        if (!client) {
            return [];
        }

        try {
            const query = `
                SELECT distinct table_name 
                FROM information_schema.tables 
                WHERE table_type = 'BASE TABLE' 
                    AND table_schema NOT IN ('pg_catalog', 'information_schema') 
                ORDER BY table_name
            `;
            const result = await client.query(query);
            return result.rows.map(row => row.table_name);
        } catch (err) {
            console.error('Error fetching tables:', err);
            throw new Error('Failed to fetch tables');
        } finally {
            client.end();
        }
    }

    static async getTableStats(args: { tableName: string; datasourceId: string }) {
        const { tableName, datasourceId } = args;
        
        // Validation du nom de table (alphanumérique + underscores)
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
            throw new Error('Invalid table name');
        }

        const datasource = await SqliteService.getDatasourceById(datasourceId);
        if (!datasource) {
            return null;
        }

        const client = await PostgresqlService.initConnection(datasource);
        if (!client) {
            return null;
        }

        try {
            const [size, rows, locks, ioStats, indexes] = await Promise.all([
                this.getTableSize(client, tableName),
                this.getTableRowsStats(client, tableName),
                this.getTableLocks(client, tableName),
                this.getTableIOStats(client, tableName),
                this.getTableIndexes(client, tableName)
            ]);

            // @ts-ignore
            return new TableStatsDto(tableName, size, locks, rows, ioStats, indexes);
        } catch (err) {
            console.error('Error fetching table stats:', err);
            throw new Error('Failed to fetch table statistics');
        } finally {
            client.end();
        }
    }

    static async getDatasourceStats(args: { datasourceId: string }) {
        const { datasourceId } = args;

        const datasource = await SqliteService.getDatasourceById(datasourceId);
        if (!datasource) {
            return null;
        }

        const client = await PostgresqlService.initConnection(datasource);
        if (!client) {
            return null;
        }

        try {
            const [
                pgStateStatementActivated,
                mainStats,
                locks,
                connections
            ] = await Promise.all([
                this.checkPgStatStatementExtensionActivated(client),
                this.getDatasourceMainStats(client),
                this.getDatasourceLocks(client),
                this.getDatasourceConnections(client)
            ]);

            return new DatasourceStatsDto(
                pgStateStatementActivated,
                mainStats,
                locks,
                connections
            );
        } catch (err) {
            console.error('Error fetching datasource stats:', err);
            throw new Error('Failed to fetch datasource statistics');
        } finally {
            client.end();
        }
    }

    private static async getTableSize(client: Client, tableName: string) {
        const query = `
            SELECT
                pg_size_pretty(pg_total_relation_size($1)) AS total_size,
                pg_size_pretty(pg_table_size($1)) AS table_size,
                pg_size_pretty(pg_indexes_size($1)) AS indexes_size;
        `;

        try {
            const res = await client.query(query, [tableName]);
            if (res.rowCount === null || res.rowCount === 0) {
                return null;
            }
            const row = res.rows[0];
            return new TableSizeDto(
                row.total_size,
                row.table_size,
                row.indexes_size
            );
        } catch (err) {
            console.error('Error fetching table size:', err);
            throw err;
        }
    }

    private static async getTableRowsStats(client: Client, tableName: string) {
        const query = `
            SELECT
                schemaname,
                relname AS table_name,
                n_live_tup AS live_rows,
                n_dead_tup AS dead_rows,
                n_mod_since_analyze AS modifications_since_analyze,
                last_analyze,
                last_autoanalyze,
                last_vacuum,
                last_autovacuum
            FROM
                pg_stat_user_tables
            WHERE
                relname = $1;
        `;

        try {
            const res = await client.query(query, [tableName]);
            if (res.rowCount === null || res.rowCount === 0) {
                return null;
            }
            const row = res.rows[0];
            return new TableRowsStatsDto(
                Number.parseFloat(row.live_rows),
                Number.parseFloat(row.dead_rows),
                row.last_analyze,
                row.last_autovacuum
            );
        } catch (err) {
            console.error('Error fetching table row stats:', err);
            throw err;
        }
    }

    private static async getTableLocks(client: Client, tableName: string) {
        const query = `
            SELECT
                locktype,
                relation::regclass AS table_name,
                mode,
                pg_locks.pid,
                pg_stat_activity.datname as username,
                pg_stat_activity.application_name,
                query_start,
                query
            FROM
                pg_locks
            JOIN
                pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
            WHERE
                relation::regclass = $1::regclass;
        `;

        try {
            const res = await client.query(query, [tableName]);
            if (res.rowCount === null || res.rowCount === 0) {
                return null;
            }

            return res.rows.map((row) => {
                return new TableLocksDto(
                    row.locktype,
                    row.mode,
                    row.pid,
                    row.username,
                    row.application_name,
                    row.query,
                    row.query_start
                );
            });
        } catch (err) {
            console.error('Error fetching table locks:', err);
            throw err;
        }
    }

    private static async getTableIOStats(client: Client, tableName: string) {
        const query = `
            SELECT 
                stat.seq_scan,
                stat.seq_tup_read,
                stat.n_live_tup,
                stat.n_dead_tup,
                stat_io.heap_blks_read,
                stat_io.heap_blks_hit,
                stat_io.idx_blks_read,
                stat_io.idx_blks_hit
            FROM pg_stat_user_tables stat
            JOIN pg_statio_all_tables stat_io ON stat_io.relname = stat.relname
            WHERE stat.relname = $1
            LIMIT 1;
        `;

        try {
            const res = await client.query(query, [tableName]);
            if (res.rowCount === null || res.rowCount === 0) {
                return null;
            }
            const row = res.rows[0];
            return new TableIOStatsDto(
                Number.parseFloat(row.seq_scan),
                Number.parseFloat(row.seq_tup_read),
                Number.parseFloat(row.n_live_tup),
                Number.parseFloat(row.n_dead_tup),
                Number.parseFloat(row.heap_blks_read),
                Number.parseFloat(row.heap_blks_hit),
                Number.parseFloat(row.idx_blks_read),
                Number.parseFloat(row.idx_blks_hit)
            );
        } catch (err) {
            console.error('Error fetching table IO stats:', err);
            throw err;
        }
    }

    public static async getTableIndexes(client: Client, tableName: string) {
        const query = `
            SELECT stat_io.indexrelname,
                   stat_io.idx_blks_read,
                   stat_io.idx_blks_hit,
                   stat.idx_scan,
                   def.indexdef
            FROM pg_statio_all_indexes stat_io
                     JOIN pg_stat_all_indexes stat
                          ON LOWER(stat.indexrelname) = LOWER(stat_io.indexrelname)
                              AND LOWER(stat.schemaname) = LOWER(stat_io.schemaname)
                     JOIN pg_indexes def ON LOWER(def.indexname) = LOWER(stat_io.indexrelname) AND LOWER(def.tablename) = LOWER(stat_io.relname)
            WHERE LOWER(stat_io.relname) = LOWER($1);
        `;

        try {
            const res = await client.query(query, [tableName]);
            if (res.rowCount === null || res.rowCount === 0) {
                return null;
            }

            return res.rows.map((row) => {
                return new TableIndexesDto(
                    row.indexrelname,
                    Number.parseFloat(row.idx_blks_read),
                    Number.parseFloat(row.idx_blks_hit),
                    Number.parseFloat(row.idx_scan),
                    row.indexdef
                );
            });
        } catch (err) {
            console.error('Error fetching table indexes:', err);
            throw err;
        }
    }

    private static async getDatasourceLocks(client: Client) {
        // Utilisation de current_database() pour éviter l'injection
        const query = `
            SELECT 
                l.locktype,
                l.relation::regclass as table_name,
                l.mode,
                l.pid,
                a.datname as username,
                a.application_name,
                a.query,
                a.query_start
            FROM pg_locks l
            JOIN pg_database d ON d.oid = l.database
            JOIN pg_stat_activity a ON a.pid = l.pid
            WHERE d.datname = current_database()
                AND l.relation::regclass::TEXT NOT LIKE 'pg_%';
        `;

        try {
            const res = await client.query(query);
            if (res.rowCount === null || res.rowCount === 0) {
                return null;
            }

            return res.rows.map((row) => {
                return new DatasourceLockDto(
                    row.locktype,
                    row.table_name,
                    row.mode,
                    row.pid,
                    row.username,
                    row.application_name,
                    row.query,
                    row.query_start
                );
            });
        } catch (err) {
            console.error('Error fetching datasource locks:', err);
            throw err;
        }
    }

    private static async getDatasourceConnections(client: Client) {
        // Utilisation de current_database() au lieu de client.database
        const query = `
            SELECT 
                usename,
                application_name,
                client_addr,
                backend_start,
                query
            FROM pg_stat_activity 
            WHERE state = 'active' 
                AND datname = current_database();
        `;

        try {
            const res = await client.query(query);
            if (res.rowCount === null || res.rowCount === 0) {
                return null;
            }

            return res.rows.map((row) => {
                return new DatasourceConnectionDto(
                    row.usename,
                    row.application_name,
                    row.client_addr,
                    row.backend_start,
                    row.query
                );
            });
        } catch (err) {
            console.error('Error fetching datasource connections:', err);
            throw err;
        }
    }

    private static async getDatasourceMainStats(client: Client) {
        const statsQuery = `
            SELECT 
                relkind AS object_type,
                COUNT(*) AS count
            FROM
                pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE
                n.nspname NOT LIKE 'pg_%'
                AND n.nspname != 'information_schema'
                AND c.relkind IN ('r', 'i', 'S')
            GROUP BY
                relkind;
        `;

        const sizeQuery = 'SELECT pg_size_pretty(pg_database_size(current_database())) AS total_size;';
        const sharedBuffersQuery = 'SHOW shared_buffers;';

        try {
            const [statsRes, sizeRes, sharedBuffersRes] = await Promise.all([
                client.query(statsQuery),
                client.query(sizeQuery),
                client.query(sharedBuffersQuery)
            ]);

            if (!statsRes || !sizeRes) {
                return null;
            }

            const getCount = (type: string) => {
                const row = statsRes.rows.find((r: any) => r.object_type === type);
                return row ? Number.parseFloat(row.count) : 0;
            };

            const tablesCount = getCount('r');
            const indexesCount = getCount('i');
            const sequencesCount = getCount('S');
            const size = sizeRes.rows[0].total_size;
            const sharedBuffersSize = sharedBuffersRes.rows[0].shared_buffers;

            return new DatasourceMainStatsDto(
                tablesCount,
                indexesCount,
                sequencesCount,
                size,
                sharedBuffersSize
            );
        } catch (err) {
            console.error('Error fetching datasource main stats:', err);
            throw err;
        }
    }

    private static async checkPgStatStatementExtensionActivated(client: Client) {
        const query = 'SELECT count(*) FROM pg_stat_statements;';

        try {
            await client.query(query);
            return true;
        } catch (err) {
            return false;
        }
    }

    public static async initConnection(datasource: DatasourceDto): Promise<Client> {
        const {Client} = require('pg');

        let client = new Client({
            host: datasource.hostname,
            port: datasource.port,
            database: datasource.dbname,
            user: datasource.username,
            password: datasource.password,
            application_name: 'dba-app',
            connectionTimeoutMillis: 0,
            idle_in_transaction_session_timeout: 0
        });

        client = await client.connect();

        return client;
    }

    public static testConnection(form: CreateDatasourceFormDto) {
        return PostgresqlService.initConnection(
            new DatasourceDto(
                null,
                form.name,
                form.username,
                form.password,
                form.hostname,
                form.port,
                form.dbname
            )
        );
    }
}
