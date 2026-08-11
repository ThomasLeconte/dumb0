export class DatasourceMainStatsDto {
    public tablesCount: number;
    public indexesCount: number;
    public sequencesCount: number;
    public size: string;


    constructor(tablesCount: number, indexesCount: number, sequencesCount: number, size: string) {
        this.tablesCount = tablesCount;
        this.indexesCount = indexesCount;
        this.sequencesCount = sequencesCount;
        this.size = size;
    }
}