import {defineStore} from "pinia";

export const useTablesStore = defineStore('tables', {
    state: () => ({
        tables: [] as string[]
    }),
    actions: {
        loadTables() {
            const result = window.ipc.send('get-tables')
                .then((res) => this.tables = res)
        }
    }
})