export class TableLocksDto {
    private type: string;
    private mode: string;
    private pid: number;
    private username: string;
    private query: string;
    private queryStart: Date;


    constructor(type: string, mode: string, pid: number, username: string, query: string, queryStart: Date) {
        this.type = type;
        this.mode = mode;
        this.pid = pid;
        this.username = username;
        this.query = query;
        this.queryStart = queryStart;
    }
}