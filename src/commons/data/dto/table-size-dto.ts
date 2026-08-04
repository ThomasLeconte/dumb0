export class TableSizeDto {
    private _total: string;
    private _dataSize: string;
    private _indexSize: string;


    constructor(total: string, dataSize: string, indexSize: string) {
        this._total = total;
        this._dataSize = dataSize;
        this._indexSize = indexSize;
    }


    get total(): string {
        return this._total;
    }

    get dataSize(): string {
        return this._dataSize;
    }

    get indexSize(): string {
        return this._indexSize;
    }
}
