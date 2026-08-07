import {defineStore} from "pinia";
import {TableStatsDto} from "../../commons/data/dto/table-stats-dto";
import {DatasourceDto} from "../../commons/data/dto/datasource-dto";

export const useDatasourcesStore = defineStore('datasources', {
    state: () => ({
        datasources: [] as DatasourceDto[],
        datasourceChoosen: null as DatasourceDto | null
    }),
    actions: {
        loadDatasources() {
            return window.ipc.send('get-datasources')
                .then((res) => this.datasources = res)
        },
        selectDatasource(datasource: DatasourceDto | null) {
            this.datasourceChoosen = datasource;
        }
    }
})
