import {TableSizeDto} from "./table-size-dto";

export class TableStatsDto {
    private _name: string;
    private _size: TableSizeDto;


    set name(value: string) {
        this._name = value;
    }

    set size(value: TableSizeDto) {
        this._size = value;
    }
}