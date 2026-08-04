import {TableSizeDto} from "./table-size-dto";
import {TableIOStatsDto} from "./table-io-stats-dto";
import {TableLocksDto} from "./table-locks-dto";
import {TableRowsStatsDto} from "./table-rows-stats-dto";

export class TableStatsDto {
    public name: string;
    public size: TableSizeDto;
    public locks: TableLocksDto;
    public rowsStats: TableRowsStatsDto;
    public ioStats: TableIOStatsDto;

    constructor(name: string, size: TableSizeDto, locks: TableLocksDto, rowsStats: TableRowsStatsDto, ioStats: TableIOStatsDto) {
        this.name = name;
        this.size = size;
        this.locks = locks;
        this.rowsStats = rowsStats;
        this.ioStats = ioStats;
    }
}
