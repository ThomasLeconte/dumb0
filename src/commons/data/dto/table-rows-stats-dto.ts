export class TableRowsStatsDto {
    private _activeRows: number;
    private _deadRows: number;
    private _lastAnalyze: Date;
    private _lastVacuum: Date;


    constructor(activeRows: number, deadRows: number, lastAnalyze: Date, lastVacuum: Date) {
        this._activeRows = activeRows;
        this._deadRows = deadRows;
        this._lastAnalyze = lastAnalyze;
        this._lastVacuum = lastVacuum;
    }


    get activeRows(): number {
        return this._activeRows;
    }

    get deadRows(): number {
        return this._deadRows;
    }

    get lastAnalyze(): Date {
        return this._lastAnalyze;
    }

    get lastVacuum(): Date {
        return this._lastVacuum;
    }
}
