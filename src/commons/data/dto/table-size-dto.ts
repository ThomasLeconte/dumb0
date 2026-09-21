export class TableSizeDto {
    public total: string;
    public dataSize: string;
    public indexSize: string;

    constructor(total: string, dataSize: string, indexSize: string) {
        this.total = total;
        this.dataSize = dataSize;
        this.indexSize = indexSize;
    }
}
