import {defineStore} from "pinia";
import {TableStatsDto} from "../../../commons/data/dto/table-stats-dto.ts";
import {api} from "../api/axios.ts";

export const useTablesStore = defineStore('tablesStore', {
    state: () => ({
        tables: [] as string[],
        tableStats: null as TableStatsDto | null
    }),
    actions: {
        loadTables(datasourceId: number) {
            return api.get(`/api/tables/${datasourceId}`)
                .then((res) => this.tables = res.data)
        },
        getTableStats(datasourceId: number, tableName: string) {
            return api.get(`/api/tables/${datasourceId}/${tableName}/stats`)
                .then((res) => this.tableStats = res.data)
        },
        clear() {
            this.tables = [];
            this.tableStats = null;
        }
    }
})
