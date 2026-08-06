export class DatasourceDto {
    id: number;
    name: string;
    username: string;
    password: string;
    hostname: string;
    port: number;

    constructor(id: number, name: string, username: string, password: string, hostname: string, port: number) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.password = password;
        this.hostname = hostname;
        this.port = port;
    }
}
