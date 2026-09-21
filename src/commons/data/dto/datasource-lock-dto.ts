export class DatasourceLockDto {
    public type: string;
    public tableName: string;
    public mode: string;
    public pid: number;
    public username: string;
    public applicationName: string;
    public query: string;
    public queryStart: Date;


    constructor(type: string, tableName: string, mode: string, pid: number, username: string, applicationName: string, query: string, queryStart: Date) {
        this.type = type;
        this.tableName = tableName;
        this.mode = mode;
        this.pid = pid;
        this.username = username;
        this.applicationName = applicationName;
        this.query = query;
        this.queryStart = queryStart;
    }
}