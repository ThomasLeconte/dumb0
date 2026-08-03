import {Client} from "pg";
import {TableStatsDto} from "../commons/data/dto/table-stats-dto";
import {TableSizeDto} from "../commons/data/dto/table-size-dto";
import {TableRowsStatsDto} from "../commons/data/dto/table-rows-stats-dto";
import {TableLocksDto} from "../commons/data/dto/table-locks-dto";

export default class PostgresqlService {

    static async getTables() {
        const client = await PostgresqlService.initConnection();
        if(client != null) {
            return client.query("SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema = 'public' ORDER BY table_name")
                .then(result => result.rows.map(row => {
                    return row['table_name']
                }))
        }
    }

    static async getTableStats(args: any) {
        const tableName = args["tableName"];

        const tableStats = new TableStatsDto();
        tableStats.name = tableName;

        const client = await PostgresqlService.initConnection();
        if(client !== null) {
            const size = await this.getTableSize(client, tableName);
            const rows = await this.getTableRowsStats(client, tableName);
            const locks = await this.getTableLocks(client, tableName);

            const request = `SELECT distinct relname AS table_name, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch, n_live_tup FROM pg_stat_user_tables where relname = '${tableName}' ORDER BY seq_tup_read desc LIMIT 1;`
            return client.query(request).then(res => {
                if(res.rowCount === null || res.rowCount === 0) {
                    return null;
                }
                const row = res.rows[0];

                return {
                    sequential_scan: row['seq_scan'],
                    sequential_tuples_read: row['seq_tup_read'],
                    index_scan: row['idx_scan'],
                    index_tuples_fetched: row['idx_tup_fetch'],
                    live_tuples: row['n_live_tup']
                }
            })
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
            if(res.rowCount === null || res.rowCount === 0) {
                return null;
            }
            const row = res.rows[0];
            console.log(row)

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
            relation::regclass = 'user_platform_link'::regclass;`;

        return client.query(query).then(res => {
            if(res.rowCount === null || res.rowCount === 0) {
                return null;
            }

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


    private static async initConnection() {
        const {Client} = require('pg');

        let client = new Client({
            database: 'pacer-api',
            user: 'pacer',
            password: 'pacer'
        });

        client = await client.connect();

        return client;
    }
}
