import {TableSizeDto} from "./table-size-dto";
import {TableIOStatsDto} from "./table-io-stats-dto";
import {TableLocksDto} from "./table-locks-dto";
import {TableRowsStatsDto} from "./table-rows-stats-dto";

export class TableStatsDto {
    public _name: string;
    public _size: TableSizeDto;
    public _locks: TableLocksDto;
    public _rowsStats: TableRowsStatsDto;
    public _ioStats: TableIOStatsDto;


    constructor(name: string, size: TableSizeDto, locks: TableLocksDto, rowsStats: TableRowsStatsDto, ioStats: TableIOStatsDto) {
        this._name = name;
        this._size = size;
        this._locks = locks;
        this._rowsStats = rowsStats;
        this._ioStats = ioStats;
    }


    public get size(): TableSizeDto {
        return this._size;
    }

    get locks(): TableLocksDto {
        return this._locks;
    }

    get rowsStats(): TableRowsStatsDto {
        return this._rowsStats;
    }

    get ioStats(): TableIOStatsDto {
        return this._ioStats;
    }
}
