import {defineStore} from "pinia";
import {TableStatsDto} from "../../commons/data/dto/table-stats-dto";
import {DatasourceDto} from "../../commons/data/dto/datasource-dto";
import {CreateDatasourceFormDto} from "../../commons/data/dto/forms/create-datasource-form-dto";
import {DatasourceStatsDto} from "../../commons/data/dto/datasource-stats-dto";
import {DatasourceQueryDto} from "../../commons/data/dto/datasource-query-dto";
import {IpcRoutes} from "../../commons/ipc-routes";
import {IpcUtils} from "./ipc-utils";

export const useDatasourcesStore = defineStore('datasources', {
    state: () => ({
        datasources: [] as DatasourceDto[],
        datasourceChoosen: null as DatasourceDto | null,
        datasourceDetails: null as DatasourceStatsDto | null,
        queryHistory: [] as DatasourceQueryDto[]
    }),
    actions: {
        loadDatasources() {
            return IpcUtils.send(IpcRoutes.DATASOURCE_GET_ALL)
                .then((res) => this.datasources = res)
        },
        selectDatasource(datasource: DatasourceDto | null) {
            this.datasourceChoosen = datasource;
            return this.loadDatasourceDetails();
        },
        deleteDatasource(datasource: DatasourceDto) {
            return IpcUtils.send(IpcRoutes.DATASOURCE_DELETE, {datasourceId: datasource.id})
                .then(() => {
                    this.clearDatasource();
                    return this.loadDatasources();
                });
        },
        updateDatasource(datasourceId: number, form: CreateDatasourceFormDto) {
            return IpcUtils.send(IpcRoutes.DATASOURCE_UPDATE, {id: datasourceId, form})
                .then(() => {
                    return this.loadDatasources();
                });
        },
        createDatasource(form: CreateDatasourceFormDto) {
            return IpcUtils.send(IpcRoutes.DATASOURCE_CREATE, {form})
                .then((res) => this.loadDatasources())
        },
        clearDatasource() {
            this.datasourceChoosen = null;
        },
        loadDatasourceDetails() {
            return IpcUtils.send(IpcRoutes.DATASOURCE_GET_STATS, {datasourceId: this.datasourceChoosen?.id})
                .then((res) => this.datasourceDetails = res)
        },
        // ----- queries -------
        executeQuery(query: string) {
            return IpcUtils.send(IpcRoutes.DATASOURCE_EXECUTE_QUERY, {datasourceId: this.datasourceChoosen?.id, query})
        },
        getQueryHistory(limit?: number) {
            return IpcUtils.send(IpcRoutes.DATASOURCE_GET_QUERY_HISTORY, {datasourceId: this.datasourceChoosen?.id, limit: limit || 20})
                .then(async (res) => {
                    this.queryHistory = res
                });
        },
        deleteQueryHistoryItem(id: number) {
            return IpcUtils.send(IpcRoutes.DATASOURCE_DELETE_QUERY_HISTORY, {id})
                .then(() => this.getQueryHistory());
        }
    }
})
