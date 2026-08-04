export class TableRowsStatsDto {
    public activeRows: number;
    public deadRows: number;
    public lastAnalyze: Date;
    public lastVacuum: Date;

    constructor(activeRows: number, deadRows: number, lastAnalyze: Date, lastVacuum: Date) {
        this.activeRows = activeRows;
        this.deadRows = deadRows;
        this.lastAnalyze = lastAnalyze;
        this.lastVacuum = lastVacuum;
    }
}
