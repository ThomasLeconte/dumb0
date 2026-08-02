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


    private static async initConnection(): Client {
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