import {defineStore} from "pinia";
import {TableStatsDto} from "../../commons/data/dto/table-stats-dto";
import {IpcRoutes} from "../../commons/ipc-routes";
import {IpcUtils} from "./ipc-utils";

export const useTablesStore = defineStore('tablesStore', {
    state: () => ({
        tables: [] as string[],
        tableStats: null as TableStatsDto | null
    }),
    actions: {
        loadTables(datasourceId: number) {
            return IpcUtils.send(IpcRoutes.TABLES_GET_ALL, {datasourceId})
                .then((res) => this.tables = res)
        },
        getTableStats(datasourceId: number, tableName: string) {
            return IpcUtils.send(IpcRoutes.TABLES_GET_STATS, {tableName, datasourceId})
                .then((res) => this.tableStats = res)
        },
        clear() {
            this.tables = [];
            this.tableStats = null;
        }
    }
})
