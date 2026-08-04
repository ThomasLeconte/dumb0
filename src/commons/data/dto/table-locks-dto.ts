export class TableLocksDto {
    private _type: string;
    private _mode: string;
    private _pid: number;
    private _username: string;
    private _query: string;
    private _queryStart: Date;


    constructor(type: string, mode: string, pid: number, username: string, query: string, queryStart: Date) {
        this._type = type;
        this._mode = mode;
        this._pid = pid;
        this._username = username;
        this._query = query;
        this._queryStart = queryStart;
    }


    get type(): string {
        return this._type;
    }

    get mode(): string {
        return this._mode;
    }

    get pid(): number {
        return this._pid;
    }

    get username(): string {
        return this._username;
    }

    get query(): string {
        return this._query;
    }

    get queryStart(): Date {
        return this._queryStart;
    }
}
