export class CreateDatasourceFormDto {
    public name: string;
    public hostname: string;
    public port: number;
    public dbname: string;
    public username: string;
    public password: string;
    public schema: string;


    constructor(name: string, hostname: string, port: number, dbname: string, username: string, password: string, schema: string = 'public') {
        this.name = name;
        this.hostname = hostname;
        this.port = port;
        this.dbname = dbname;
        this.username = username;
        this.password = password;
        this.schema = schema;
    }
}