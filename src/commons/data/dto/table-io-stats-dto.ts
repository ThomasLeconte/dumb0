export class TableIOStatsDto {
    private _sequentialScan: number;
    private _sequentialLinesRead: number;
    private _indexScan: number;
    private _indexLinesRead: number;
    private _diskBlocksRead: number;
    private _cachediskBlocksRead: number;
    private _indexBlocksRead: number;
    private _cacheIndexBlocksRead: number;


    constructor(sequentialScan: number, sequentialLinesRead: number, indexScan: number, indexLinesRead: number, diskBlocksRead: number, cachediskBlocksRead: number, indexBlocksRead: number, cacheIndexBlocksRead: number) {
        this._sequentialScan = sequentialScan;
        this._sequentialLinesRead = sequentialLinesRead;
        this._indexScan = indexScan;
        this._indexLinesRead = indexLinesRead;
        this._diskBlocksRead = diskBlocksRead;
        this._cachediskBlocksRead = cachediskBlocksRead;
        this._indexBlocksRead = indexBlocksRead;
        this._cacheIndexBlocksRead = cacheIndexBlocksRead;
    }


    get sequentialScan(): number {
        return this._sequentialScan;
    }

    get sequentialLinesRead(): number {
        return this._sequentialLinesRead;
    }

    get indexScan(): number {
        return this._indexScan;
    }

    get indexLinesRead(): number {
        return this._indexLinesRead;
    }

    get diskBlocksRead(): number {
        return this._diskBlocksRead;
    }

    get cachediskBlocksRead(): number {
        return this._cachediskBlocksRead;
    }

    get indexBlocksRead(): number {
        return this._indexBlocksRead;
    }

    get cacheIndexBlocksRead(): number {
        return this._cacheIndexBlocksRead;
    }
}
