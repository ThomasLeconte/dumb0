import {TableSizeDto} from "./table-size-dto";
import {TableIOStatsDto} from "./table-io-stats-dto";
import {TableLocksDto} from "./table-locks-dto";
import {TableRowsStatsDto} from "./table-rows-stats-dto";
import {TableIndexesDto} from "./table-indexes-dto";

export class TableStatsDto {
    public name: string;
    public size: TableSizeDto;
    public locks: TableLocksDto;
    public rowsStats: TableRowsStatsDto;
    public ioStats: TableIOStatsDto;
    public indexesStats: TableIndexesDto[];

    constructor(name: string, size: TableSizeDto, locks: TableLocksDto, rowsStats: TableRowsStatsDto, ioStats: TableIOStatsDto, indexesStats: TableIndexesDto[]) {
        this.name = name;
        this.size = size;
        this.locks = locks;
        this.rowsStats = rowsStats;
        this.ioStats = ioStats;
        this.indexesStats = indexesStats;
    }
}
