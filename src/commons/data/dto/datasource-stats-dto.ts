import {DatasourceLockDto} from "./datasource-lock-dto";
import {DatasourceConnectionDto} from "./datasource-connection-dto";
import {DatasourceMainStatsDto} from "./datasource-main-stats-dto";

export class DatasourceStatsDto {
    public pgStatStatementExtensionActivated: boolean;
    public stats: DatasourceMainStatsDto;
    public locks: DatasourceLockDto[];
    public connections: DatasourceConnectionDto[];


    constructor(pgStatStatementExtensionActivated: boolean, stats: DatasourceMainStatsDto, locks: DatasourceLockDto[], connections: DatasourceConnectionDto[]) {
        this.pgStatStatementExtensionActivated = pgStatStatementExtensionActivated;
        this.stats = stats;
        this.locks = locks;
        this.connections = connections;
    }
}