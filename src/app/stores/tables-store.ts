import {defineStore} from "pinia";

export const useTablesStore = defineStore('tables', {
    state: () => ({
        tables: [] as string[],
        tableStats: {} as any
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
