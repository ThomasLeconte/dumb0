export class DatasourceDto {
    name: string;
    username: string;
    password: string;
    hostname: string;
    port: number;

    constructor(name: string, username: string, password: string, hostname: string, port: number) {
        this.name = name;
        this.username = username;
        this.password = password;
        this.hostname = hostname;
        this.port = port;
    }
}
