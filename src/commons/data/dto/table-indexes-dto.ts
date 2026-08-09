export class TableIndexesDto {
    public name: string;
    public indexBlocksRead: number;
    public cacheIndexBlocksRead: number;
    public scansTime: number;


    constructor(name: string, indexBlocksRead: number, cacheIndexBlocksRead: number, scansTime: number) {
        this.name = name;
        this.indexBlocksRead = indexBlocksRead;
        this.cacheIndexBlocksRead = cacheIndexBlocksRead;
        this.scansTime = scansTime;
    }
}
