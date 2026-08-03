import {Client} from "pg";

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

        const client = await PostgresqlService.initConnection();
        if(client !== null) {
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


    private static async initConnection(): Promise<Client> {
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
