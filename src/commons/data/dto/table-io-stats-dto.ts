export class TableIOStatsDto {
    public sequentialScan: number;
    public sequentialLinesRead: number;
    public indexScan: number;
    public indexLinesRead: number;
    public diskBlocksRead: number;
    public cachediskBlocksRead: number;
    public indexBlocksRead: number;
    public cacheIndexBlocksRead: number;

    constructor(sequentialScan: number, sequentialLinesRead: number, indexScan: number, indexLinesRead: number, diskBlocksRead: number, cachediskBlocksRead: number, indexBlocksRead: number, cacheIndexBlocksRead: number) {
        this.sequentialScan = sequentialScan;
        this.sequentialLinesRead = sequentialLinesRead;
        this.indexScan = indexScan;
        this.indexLinesRead = indexLinesRead;
        this.diskBlocksRead = diskBlocksRead;
        this.cachediskBlocksRead = cachediskBlocksRead;
        this.indexBlocksRead = indexBlocksRead;
        this.cacheIndexBlocksRead = cacheIndexBlocksRead;
    }
}
