import {TableSizeDto} from "./table-size-dto.js";
import {TableIOStatsDto} from "./table-io-stats-dto.js";
import {TableLocksDto} from "./table-locks-dto.js";
import {TableRowsStatsDto} from "./table-rows-stats-dto.js";
import {TableIndexesDto} from "./table-indexes-dto.js";

export class TableStatsDto {
    public name: string;
    public size: TableSizeDto;
    public locks: TableLocksDto[];
    public rowsStats: TableRowsStatsDto;
    public ioStats: TableIOStatsDto;
    public indexesStats: TableIndexesDto[];

    constructor(name: string, size: TableSizeDto, locks: TableLocksDto[], rowsStats: TableRowsStatsDto, ioStats: TableIOStatsDto, indexesStats: TableIndexesDto[]) {
        this.name = name;
        this.size = size;
        this.locks = locks;
        this.rowsStats = rowsStats;
        this.ioStats = ioStats;
        this.indexesStats = indexesStats;
    }
}
