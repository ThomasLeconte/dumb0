export class TableIndexesDto {
    public name: string;
    public indexBlocksRead: number;
    public cacheIndexBlocksRead: number;


    constructor(name: string, indexBlocksRead: number, cacheIndexBlocksRead: number) {
        this.name = name;
        this.indexBlocksRead = indexBlocksRead;
        this.cacheIndexBlocksRead = cacheIndexBlocksRead;
    }
}
