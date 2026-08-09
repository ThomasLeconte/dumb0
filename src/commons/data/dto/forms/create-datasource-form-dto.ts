export class CreateDatasourceFormDto {
    public name: string;
    public hostname: string;
    public port: number;
    public dbname: string;
    public username: string;
    public password: string;


    constructor(name: string, hostname: string, port: number, dbname: string, username: string, password: string) {
        this.name = name;
        this.hostname = hostname;
        this.port = port;
        this.dbname = dbname;
        this.username = username;
        this.password = password;
    }
}