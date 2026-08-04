import {defineStore} from "pinia";
import {TableStatsDto} from "../../commons/data/dto/table-stats-dto";

export const useTablesStore = defineStore('tables', {
    state: () => ({
        tables: [] as string[],
        tableStats: null as unknown as TableStatsDto
    }),
    actions: {
        loadTables() {
            return window.ipc.send('get-tables')
                .then((res) => this.tables = res)
        },
        getTableStats(tableName: string) {
            return window.ipc.send('get-table-stats', {tableName})
                .then((res) => this.tableStats = res)
        }
    }
})
