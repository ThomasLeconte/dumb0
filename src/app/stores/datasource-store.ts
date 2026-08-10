import {defineStore} from "pinia";
import {TableStatsDto} from "../../commons/data/dto/table-stats-dto";
import {DatasourceDto} from "../../commons/data/dto/datasource-dto";
import {CreateDatasourceFormDto} from "../../commons/data/dto/forms/create-datasource-form-dto";
import {DatasourceStatsDto} from "../../commons/data/dto/datasource-stats-dto";

export const useDatasourcesStore = defineStore('datasources', {
    state: () => ({
        datasources: [] as DatasourceDto[],
        datasourceChoosen: null as DatasourceDto | null,
        datasourceDetails: null as DatasourceStatsDto | null
    }),
    actions: {
        loadDatasources() {
            return window.ipc.send('get-datasources')
                .then((res) => this.datasources = res)
        },
        selectDatasource(datasource: DatasourceDto | null) {
            this.datasourceChoosen = datasource;
        },
        createDatasource(form: CreateDatasourceFormDto) {
            return window.ipc.send('create-datasource', {form})
                .then((res) => this.loadDatasources())
        },
        loadDatasourceDetails() {
            return window.ipc.send('get-datasource-stats', {datasourceId: this.datasourceChoosen.id})
                .then((res) => this.datasourceDetails = res)
        }
    }
})
