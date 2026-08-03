export class TableSizeDto {
    private total: string;
    private dataSize: string;
    private indexSize: string;


    constructor(total: string, dataSize: string, indexSize: string) {
        this.total = total;
        this.dataSize = dataSize;
        this.indexSize = indexSize;
    }
}