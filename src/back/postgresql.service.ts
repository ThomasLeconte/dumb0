import {Client} from "pg";
import {TableStatsDto} from "../commons/data/dto/table-stats-dto";
import {TableSizeDto} from "../commons/data/dto/table-size-dto";
import {TableRowsStatsDto} from "../commons/data/dto/table-rows-stats-dto";
import {TableLocksDto} from "../commons/data/dto/table-locks-dto";
import {TableIOStatsDto} from "../commons/data/dto/table-io-stats-dto";
import {TableIndexesDto} from "../commons/data/dto/table-indexes-dto";
import {SqliteService} from "./sqlite.service";
import {DatasourceDto} from "../commons/data/dto/datasource-dto";

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
            usename,
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

            const result = [];

            res.rows.forEach((row) => {
                result.push(new TableLocksDto(
                    row['type'],
                    row['mode'],
                    row['pid'],
                    row['username'],
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
                    row['idx_blks_hit']
                );
            })
        })
    }


    private static async initConnection(datasource: DatasourceDto): Promise<Client> {
        const {Client} = require('pg');

        let client = new Client({
            host: datasource.hostname,
            port: datasource.port,
            database: datasource.name,
            user: datasource.username,
            password: datasource.password,
            connectionTimeoutMillis: 0,
            idle_in_transaction_session_timeout: 0
        });

        client = await client.connect();

        return client;
    }
}
