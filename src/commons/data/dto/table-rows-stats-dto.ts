export class TableRowsStatsDto {
    private activeRows: number;
    private deadRows: number;
    private lastAnalyze: Date;
    private lastVacuum: Date;


    constructor(activeRows: number, deadRows: number, lastAnalyze: Date, lastVacuum: Date) {
        this.activeRows = activeRows;
        this.deadRows = deadRows;
        this.lastAnalyze = lastAnalyze;
        this.lastVacuum = lastVacuum;
    }
}