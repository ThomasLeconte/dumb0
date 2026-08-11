import {DatasourceLockDto} from "./datasource-lock-dto";
import {DatasourceConnectionDto} from "./datasource-connection-dto";
import {DatasourceMainStatsDto} from "./datasource-main-stats-dto";

export class DatasourceStatsDto {
    public stats: DatasourceMainStatsDto;
    public locks: DatasourceLockDto[];
    public connections: DatasourceConnectionDto[];


    constructor(stats: DatasourceMainStatsDto, locks: DatasourceLockDto[], connections: DatasourceConnectionDto[]) {
        this.stats = stats;
        this.locks = locks;
        this.connections = connections;
    }
}