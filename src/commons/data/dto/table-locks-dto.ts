export class TableLocksDto {
    public type: string;
    public mode: string;
    public pid: number;
    public username: string;
    public query: string;
    public queryStart: Date;

    constructor(type: string, mode: string, pid: number, username: string, query: string, queryStart: Date) {
        this.type = type;
        this.mode = mode;
        this.pid = pid;
        this.username = username;
        this.query = query;
        this.queryStart = queryStart;
    }
}
