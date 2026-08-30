import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {DatasourceDto} from "../../commons/data/dto/datasource-dto";
import {CreateDatasourceFormDto} from "../../commons/data/dto/forms/create-datasource-form-dto";
import {DatasourceStatsDto} from "../../commons/data/dto/datasource-stats-dto";
import {DatasourceQueryDto} from "../../commons/data/dto/datasource-query-dto";
import {IpcRoutes} from "../../commons/ipc-routes";
import {IpcUtils} from "./ipc-utils";
import {CreateQueryFormDto} from "../../commons/data/dto/forms/create-query-form-dto";
import {DatasourceSavedQueryDto} from "../../commons/data/dto/datasource-saved-query-dto";
import DOMPurify from 'dompurify';
import { Converter } from "showdown";

export const useDatasourcesStore = defineStore('datasources', {
    state: () => ({
        datasources: [] as DatasourceDto[],
        datasourceChoosen: null as DatasourceDto | null,
        datasourceDetails: null as DatasourceStatsDto | null,
        queryHistory: [] as DatasourceQueryDto[],
        savedQueries: [] as DatasourceSavedQueryDto[],
        // États pour le streaming AI
        aiResponse: '',
        isAnalyzing: false,
        rawAiResponse: '',
        currentRequestId: null as string | null,
        aiStreamError: null as string | null,
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
        executeQuery(query: string) {
            return IpcUtils.send(IpcRoutes.DATASOURCE_EXECUTE_QUERY, {datasourceId: this.datasourceChoosen?.id, query})
        },
        // ----- queries history -------
        getQueryHistory(limit?: number) {
            return IpcUtils.send(IpcRoutes.DATASOURCE_GET_QUERY_HISTORY, {datasourceId: this.datasourceChoosen?.id, limit: limit || 20})
                .then(async (res) => {
                    this.queryHistory = res
                });
        },
        deleteQueryHistoryItem(id: number) {
            return IpcUtils.send(IpcRoutes.DATASOURCE_DELETE_QUERY_HISTORY, {id})
                .then(() => this.getQueryHistory());
        },
        // ----- saved queries -------
        getSavedQueries() {
            return IpcUtils.send(IpcRoutes.DATASOURCE_GET_SAVED_QUERIES, {datasourceId: this.datasourceChoosen?.id})
                .then((res) => {
                    console.log("saved queries", res);
                    this.savedQueries = res
                })
        },
        createSavedQuery(form: CreateQueryFormDto) {
            return IpcUtils.send(IpcRoutes.DATASOURCE_CREATE_SAVED_QUERY, {form})
                .then(() => this.getSavedQueries())
        },
        updateSavedQuery(queryId: number, form: CreateQueryFormDto) {
            return IpcUtils.send(IpcRoutes.DATASOURCE_UPDATE_SAVED_QUERY, {id: queryId, form})
                .then(() => this.getSavedQueries())
        },
        deleteSavedQuery(queryId: number) {
            return IpcUtils.send(IpcRoutes.DATASOURCE_DELETE_SAVED_QUERY, {id: queryId})
                .then(() => this.getSavedQueries())
        },
        // --------- ask AI (non-streaming) ------------
        analyzeQuery(query: string) {
            return IpcUtils.send(IpcRoutes.DATASOURCE_ASK_AI_QUERY, {query, datasourceId: this.datasourceChoosen?.id.toString()});
        },
        
        // --------- ask AI (streaming) ------------
        /**
         * Démarre une analyse IA en streaming.
         * @param query - La requête SQL à analyser.
         */
        async startAiAnalysisStream(query: string): Promise<void> {
            if (!query.trim() || this.isAnalyzing) return;

            // Réinitialiser les états
            this.aiResponse = '';
            this.rawAiResponse = '';
            this.isAnalyzing = true;
            this.aiStreamError = null;
            this.currentRequestId = crypto.randomUUID();

            try {
                // Démarrer le stream via IPC
                const { requestId } = await IpcUtils.send(
                    IpcRoutes.DATASOURCE_ASK_AI_QUERY_STREAM_START,
                    { query, datasourceId: this.datasourceChoosen?.id.toString(), requestId: this.currentRequestId }
                );

                // S'abonner aux événements de streaming
                window.electronAPI.onAiStreamChunk(requestId, (chunk: string) => {
                    this.rawAiResponse += chunk;
                    // Option : Afficher le texte brut pendant le stream
                    this.aiResponse = this.rawAiResponse;
                });

                window.electronAPI.onAiStreamEnd(requestId, () => {
                    this._finalizeAiStream();
                });

                window.electronAPI.onAiStreamError(requestId, (error: string) => {
                    console.error("[AI Stream] Error:", error);
                    this.aiStreamError = error;
                    this._finalizeAiStream();
                });

            } catch (error) {
                console.error("[AI Stream] Failed to start:", error);
                this.aiStreamError = error instanceof Error ? error.message : String(error);
                this.isAnalyzing = false;
            }
        },

        /**
         * Annule l'analyse IA en cours.
         */
        async cancelAiAnalysisStream(): Promise<void> {
            if (!this.isAnalyzing || !this.currentRequestId) return;

            try {
                await IpcUtils.send(
                    IpcRoutes.DATASOURCE_ASK_AI_QUERY_STREAM_CANCEL,
                    { requestId: this.currentRequestId }
                );
            } catch (error) {
                console.error("[AI Stream] Failed to cancel:", error);
            } finally {
                // Marquer comme annulé
                this._finalizeAiStream(true);
            }
        },

        /**
         * Finalise le stream (appelé à la fin ou en cas d'erreur).
         * @param wasCancelled - Si vrai, le stream a été annulé.
         */
        _finalizeAiStream(wasCancelled = false): void {
            this.isAnalyzing = false;

            if (!wasCancelled && !this.aiStreamError) {
                // Option 2 : Parser le Markdown à la fin pour un rendu propre
                const converter = new Converter();
                converter.setOption('tables', true);
                const parsedHtml = converter.makeHtml(this.rawAiResponse);
                this.aiResponse = DOMPurify.sanitize(parsedHtml);
            }

            // Nettoyer l'ID de requête
            this.currentRequestId = null;
        },
    },
    getters: {
        // Getters pour accéder aux états de manière réactive
        getAiResponse: (state) => state.aiResponse,
        getIsAnalyzing: (state) => state.isAnalyzing,
        getAiStreamError: (state) => state.aiStreamError,
    },
})
