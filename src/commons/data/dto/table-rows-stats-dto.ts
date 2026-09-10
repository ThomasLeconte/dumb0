export class TableRowsStatsDto {
    public activeRows: number;
    public deadRows: number;
    public lastAnalyze: Date;
    public lastAutoAnalyze: Date;
    public lastVacuum: Date;
    public lastAutoVacuum: Date;


    constructor(activeRows: number, deadRows: number, lastAnalyze: Date, lastAutoAnalyze: Date, lastVacuum: Date, lastAutoVacuum: Date) {
        this.activeRows = activeRows;
        this.deadRows = deadRows;
        this.lastAnalyze = lastAnalyze;
        this.lastAutoAnalyze = lastAutoAnalyze;
        this.lastVacuum = lastVacuum;
        this.lastAutoVacuum = lastAutoVacuum;
    }
}
