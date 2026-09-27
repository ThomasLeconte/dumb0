import {defineStore} from "pinia";
import {TableStatsDto} from "../../../commons/data/dto/table-stats-dto.ts";
import {api} from "../api/axios.ts";

export const useTablesStore = defineStore('tablesStore', {
    state: () => ({
        tables: [] as string[],
        tableStats: null as TableStatsDto | null,
        loadingDetails: false
    }),
    actions: {
        loadTables(datasourceId: number) {
            return api.get(`/api/tables/${datasourceId}`)
                .then((res) => this.tables = res.data)
        },
        getTableStats(datasourceId: number, tableName: string) {
            this.loadingDetails = true;
            return api.get(`/api/tables/${datasourceId}/${tableName}/stats`)
                .then((res) => this.tableStats = res.data)
                .finally(() => {
                    const randomTimeout = Math.floor(Math.random() * (500 - 100) + 100);
                    setTimeout(() => this.loadingDetails = false, randomTimeout)
                });
        },
        clear() {
            this.tables = [];
            this.tableStats = null;
        }
    }
})
