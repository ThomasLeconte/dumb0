import {DatasourceLockDto} from "./datasource-lock-dto";
import {DatasourceConnectionDto} from "./datasource-connection-dto";

export class DatasourceStatsDto {
    public locks: DatasourceLockDto[];
    public connections: DatasourceConnectionDto[];


    constructor(locks: DatasourceLockDto[], connections: DatasourceConnectionDto[]) {
        this.locks = locks;
        this.connections = connections;
    }
}