export class DatasourceDto {
    id: number;
    name: string;
    hostname: string;
    port: number;
    dbname: string;
    username: string;
    password: string;

    constructor(id: number, name: string, username: string, password: string, hostname: string, port: number, dbname: string) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.password = password;
        this.hostname = hostname;
        this.port = port;
        this.dbname = dbname;
    }
}
