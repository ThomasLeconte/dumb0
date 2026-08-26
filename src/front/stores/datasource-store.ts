import {defineStore} from "pinia";
import {TableStatsDto} from "../../commons/data/dto/table-stats-dto";
import {DatasourceDto} from "../../commons/data/dto/datasource-dto";
import {CreateDatasourceFormDto} from "../../commons/data/dto/forms/create-datasource-form-dto";
import {DatasourceStatsDto} from "../../commons/data/dto/datasource-stats-dto";
import {DatasourceQueryDto} from "../../commons/data/dto/datasource-query-dto";

export const useDatasourcesStore = defineStore('datasources', {
    state: () => ({
        datasources: [] as DatasourceDto[],
        datasourceChoosen: null as DatasourceDto | null,
        datasourceDetails: null as DatasourceStatsDto | null,
        queryHistory: [] as DatasourceQueryDto[]
    }),
    actions: {
        loadDatasources() {
            return window.ipc.send('get-datasources')
                .then((res) => this.datasources = res)
        },
        selectDatasource(datasource: DatasourceDto | null) {
            this.datasourceChoosen = datasource;
            return this.loadDatasourceDetails();
        },
        deleteDatasource(datasource: DatasourceDto) {
            return window.ipc.send('delete-datasource', {datasourceId: datasource.id})
                .then(() => {
                    this.clearDatasource();
                    return this.loadDatasources();
                });
        },
        updateDatasource(datasourceId: number, form: CreateDatasourceFormDto) {
            return window.ipc.send('update-datasource', {id: datasourceId, form})
                .then(() => {
                    return this.loadDatasources();
                });
        },
        createDatasource(form: CreateDatasourceFormDto) {
            return window.ipc.send('create-datasource', {form})
                .then((res) => this.loadDatasources())
        },
        clearDatasource() {
            this.datasourceChoosen = null;
        },
        loadDatasourceDetails() {
            return window.ipc.send('get-datasource-stats', {datasourceId: this.datasourceChoosen.id})
                .then((res) => this.datasourceDetails = res)
        },
        // ----- queries -------
        executeQuery(query: string) {
            return window.ipc.send('execute-query', {datasourceId: this.datasourceChoosen.id, query})
        },
        getQueryHistory(limit?: number) {
            return window.ipc.send('get-query-history', {datasourceId: this.datasourceChoosen.id, limit: limit || 20})
                .then(async (res) => {
                    this.queryHistory = res
                });
        },
        deleteQueryHistoryItem(id: number) {
            return window.ipc.send('delete-query-history', {id})
                .then(() => this.getQueryHistory());
        }
    }
})
