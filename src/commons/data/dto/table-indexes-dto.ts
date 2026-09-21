export class TableIndexesDto {
    public name: string;
    public indexBlocksRead: number;
    public cacheIndexBlocksRead: number;
    public scansTime: number;
    public def: string;


    constructor(name: string, indexBlocksRead: number, cacheIndexBlocksRead: number, scansTime: number, def: string) {
        this.name = name;
        this.indexBlocksRead = indexBlocksRead;
        this.cacheIndexBlocksRead = cacheIndexBlocksRead;
        this.scansTime = scansTime;
        this.def = def;
    }
}
