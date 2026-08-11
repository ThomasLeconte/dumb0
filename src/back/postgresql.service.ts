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

export default class PostgresqlService {

    static async getTables(args) {
        const datasource = await SqliteService.getDatasourceById(args['datasourceId']);

        const client = await PostgresqlService.initConnection(datasource);
        if(client != null) {
            return client.query("SELECT distinct table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' and table_schema not in ('pg_catalog', 'information_schema') ORDER BY table_name")
                .then(result => result.rows.map(row => {

                    client.end();

                    return row['table_name']
                }))
        }
    }

    static async getTableStats(args: any) {
        const tableName = args["tableName"];
        const datasourceId = args["datasourceId"];

        const datasource = await SqliteService.getDatasourceById(datasourceId);

        const client = await PostgresqlService.initConnection(datasource);
        if(client !== null) {
            const size = await this.getTableSize(client, tableName);
            const rows = await this.getTableRowsStats(client, tableName);
            const locks = await this.getTableLocks(client, tableName);
            const ioStats = await this.getTableIOStats(client, tableName);
            const indexes = await this.getTableIndexes(client, tableName);

            client.end();

            console.log(size, rows, locks, ioStats);

            // @ts-ignore
            const result = new TableStatsDto(tableName, size, locks, rows, ioStats, indexes);

            return result;
        }
        return null;
    }

    static async getDatasourceStats(args: any) {
        const datasourceId = args["datasourceId"];

        const datasource = await SqliteService.getDatasourceById(datasourceId);
        const client = await PostgresqlService.initConnection(datasource);
        if(client !== null) {
            const mainStats = await this.getDatasourceMainStats(client);
            const locks = await this.getDatasourceLocks(client);
            const connections = await this.getDatasourceConnections(client);

            return new DatasourceStatsDto(mainStats, locks, connections);
        }
        return null;
    }

    private static async getTableSize(client: Client, tableName: string) {
        const query = `SELECT
            pg_size_pretty(pg_total_relation_size('${tableName}')) AS total_size,
            pg_size_pretty(pg_table_size('${tableName}')) AS table_size,
            pg_size_pretty(pg_indexes_size('${tableName}')) AS indexes_size;`

        return client.query(query).then(res => {
            if(res.rowCount === null || res.rowCount === 0) {
                return null;
            }
            const row = res.rows[0];

            return new TableSizeDto(row['total_size'], row['table_size'], row['indexes_size'])
        })
    }

    private static async getTableRowsStats(client: Client, tableName: string) {
        const query = `SELECT
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
            relname = '${tableName}';`

        return client.query(query).then(res => {
            if(res.rowCount === null || res.rowCount === 0) return null;
            const row = res.rows[0];

            return new TableRowsStatsDto(row['live_rows'], row['dead_rows'], row['last_analyze'], row['last_autovacuum']);
        })
    }

    private static async getTableLocks(client: Client, tableName: string) {
        const query = `SELECT
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
            relation::regclass = '${tableName}'::regclass;`;

        return client.query(query).then(res => {
            if(res.rowCount === null || res.rowCount === 0) return null;

            console.log("lock", res)

            const result = [];

            res.rows.forEach((row) => {
                result.push(new TableLocksDto(
                    row['type'],
                    row['mode'],
                    row['pid'],
                    row['username'],
                    row['application_name'],
                    row['query'],
                    row['query_start']
                ))
            });

            return result;
        })
    }

    private static async getTableIOStats(client: any, tableName: string) {
        const query = `select stat.seq_scan, stat.seq_tup_read, stat.n_live_tup, stat.n_dead_tup, stat_io.heap_blks_read, stat_io.heap_blks_hit, stat_io.idx_blks_read, stat_io.idx_blks_hit
            from pg_stat_all_tables stat
            join pg_statio_all_tables stat_io on stat_io.relname = stat.relname
            where stat.relname = '${tableName}'
            limit 1;`;

        return client.query(query).then(res => {
            if (res.rowCount === null || res.rowCount === 0) return null;
            const row = res.rows[0];
            return new TableIOStatsDto(
                row['seq_scan'],
                row['seq_tup_read'],
                row['n_live_tup'],
                row['n_dead_tup'],
                row['heap_blks_read'],
                row['heap_blks_hit'],
                row['idx_blks_read'],
                row['idx_blks_hit']
            );
        });
    }

    private static async getTableIndexes(client: Client, tableName: string) {
        const query = `select stat_io.indexrelname, stat_io.idx_blks_read, stat_io.idx_blks_hit, stat.idx_scan
            from pg_statio_all_indexes stat_io 
            join pg_stat_all_indexes stat on stat.indexrelname = stat_io.indexrelname and stat.schemaname = stat_io.schemaname
            where stat_io.relname = '${tableName}';`

        return client.query(query).then(res => {
            if (res.rowCount === null || res.rowCount === 0) return null;

            return res.rows.map((row) => {
                return new TableIndexesDto(
                    row['indexrelname'],
                    row['idx_blks_read'],
                    row['idx_blks_hit'],
                    row['idx_scan']
                );
            })
        })
    }

    private static async getDatasourceLocks(client: Client) {
        const query = `select l.locktype, l.relation::regclass as table_name, l.mode, l.pid, a.datname as username, a.application_name, a.query, a.query_start
                       from pg_locks l
                       join pg_database d on d.oid = l.database
                       join pg_stat_activity a on a.pid = l.pid
                       where d.datname = '${client.database}'
                       and l.relation::regclass::TEXT not like 'pg_%';`;

        return client.query(query).then(res => {
            if (res.rowCount === null || res.rowCount === 0) return null;

            return res.rows.map((row) => {
                return new DatasourceLockDto(
                    row['type'],
                    row['table_name'],
                    row['mode'],
                    row['pid'],
                    row['username'],
                    row['application_name'],
                    row['query'],
                    row['query_start']
                );
            })
        });
    }

    private static async getDatasourceConnections(client: Client) {
        const query = `SELECT * FROM pg_stat_activity WHERE state = 'active' and datname = '${client.database}';`;

        return client.query(query).then((res) => {
            if (res.rowCount === null || res.rowCount === 0) return null;

            return res.rows.map((row) => {
                return new DatasourceConnectionDto(
                    row['usename'],
                    row['application_name'],
                    row['client_addr'],
                    row['backend_start'],
                    row['query']
                )
            })
        })
    }

    private static async getDatasourceMainStats(client: Client) {
        const statsQuery = `SELECT relkind AS object_type,
                              COUNT(*) AS count
                       FROM
                           pg_class c
                           JOIN
                           pg_namespace n
                       ON n.oid = c.relnamespace
                       WHERE
                           n.nspname NOT LIKE 'pg_%'
                         AND n.nspname != 'information_schema'
                         and c.relkind in ('r', 'i', 'S')
                       GROUP BY
                           relkind;`;

        const sizeQuery = 'SELECT pg_size_pretty(pg_database_size(current_database())) AS total_size;';

        return Promise.all([client.query(statsQuery), client.query(sizeQuery)])
            .then((res) => {
                const statsRes = res[0];
                const sizeRes = res[1];

                if(statsRes == null || sizeRes == null) return null;

                let tablesCount, indexesCount, sequencesCount = 0;

                tablesCount = statsRes.rows.find(r => 'r' === r['object_type'])['count'];
                indexesCount = statsRes.rows.find(r => 'i' === r['object_type'])['count'];
                sequencesCount = statsRes.rows.find(r => 'S' === r['object_type'])['count'];
                const size = sizeRes.rows[0]['total_size'];

                return new DatasourceMainStatsDto(tablesCount, indexesCount, sequencesCount, size);
            })
    }


    private static async initConnection(datasource: DatasourceDto): Promise<Client> {
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
}
