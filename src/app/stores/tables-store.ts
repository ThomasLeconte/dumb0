import {defineStore} from "pinia";
import {TableStatsDto} from "../../commons/data/dto/table-stats-dto";

export const useTablesStore = defineStore('tables', {
    state: () => ({
        tables: [] as string[],
        tableStats: null as unknown as TableStatsDto
    }),
    actions: {
        loadTables(datasourceId: number) {
            return window.ipc.send('get-tables', {datasourceId})
                .then((res) => this.tables = res)
        },
        getTableStats(datasourceId: number, tableName: string) {
            return window.ipc.send('get-table-stats', {tableName, datasourceId})
                .then((res) => this.tableStats = res)
        }
    }
})
