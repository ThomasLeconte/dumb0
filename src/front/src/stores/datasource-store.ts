import {defineStore} from "pinia";
import {DatasourceDto} from "../../../commons/data/dto/datasource-dto.ts";
import {CreateDatasourceFormDto} from "../../../commons/data/dto/forms/create-datasource-form-dto.ts";
import {DatasourceStatsDto} from "../../../commons/data/dto/datasource-stats-dto.ts";
import {DatasourceQueryDto} from "../../../commons/data/dto/datasource-query-dto.ts";
import {CreateQueryFormDto} from "../../../commons/data/dto/forms/create-query-form-dto.ts";
import {DatasourceSavedQueryDto} from "../../../commons/data/dto/datasource-saved-query-dto.ts";
import {api, API_BASE_URL} from "../api/axios.ts";
import DOMPurify from 'dompurify';
import {Converter} from "showdown";

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
        getAll() {
            return api.get('/api/datasources')
                .then((res) => this.datasources = res.data)
        },
        selectDatasource(datasource: DatasourceDto | null) {
            this.datasourceChoosen = datasource;
            return this.loadDatasourceDetails();
        },
        deleteDatasource(datasource: DatasourceDto) {
            return api.delete(`/api/datasources/${datasource.id}`)
                .then(() => {
                    this.clearDatasource();
                    return this.getAll();
                });
        },
        updateDatasource(datasourceId: number, form: CreateDatasourceFormDto) {
            return api.put(`/api/datasources/${datasourceId}`, form)
                .then(() => {
                    return this.getAll();
                });
        },
        createDatasource(form: CreateDatasourceFormDto) {
            return api.post('/api/datasources', form)
                .then((res) => this.getAll())
        },
        clearDatasource() {
            this.datasourceChoosen = null;
        },
        loadDatasourceDetails() {
            return api.get(`/api/datasources/${this.datasourceChoosen?.id}/stats`)
                .then((res) => this.datasourceDetails = res.data)
        },
        executeQuery(query: string) {
            return api.post(`/api/datasources/${this.datasourceChoosen?.id}/query`, {query})
                .then((res) => res.data)
        },
        // ----- queries history -------
        getQueryHistory(limit?: number) {
            return api.get(`/api/datasources/${this.datasourceChoosen?.id}/query-history`, {
                params: {limit: limit || 20}
            })
                .then(async (res) => {
                    this.queryHistory = res.data
                });
        },
        deleteQueryHistoryItem(id: number) {
            return api.delete(`/api/datasources/query-history/${id}`)
                .then(() => this.getQueryHistory());
        },
        // ----- saved queries -------
        getSavedQueries() {
            return api.get(`/api/datasources/${this.datasourceChoosen?.id}/saved-queries`)
                .then((res) => {
                    console.log("saved queries", res.data);
                    this.savedQueries = res.data
                })
        },
        createSavedQuery(form: CreateQueryFormDto) {
            return api.post(`/api/datasources/${form.datasourceId}/saved-queries`, form)
                .then(() => this.getSavedQueries())
        },
        updateSavedQuery(queryId: number, form: CreateQueryFormDto) {
            return api.put(`/api/datasources/saved-queries/${queryId}`, {
                name: form.name,
                query: form.query
            })
                .then(() => this.getSavedQueries())
        },
        deleteSavedQuery(queryId: number) {
            return api.delete(`/api/datasources/saved-queries/${queryId}`)
                .then(() => this.getSavedQueries())
        },
        // --------- ask AI (non-streaming) ------------
        analyzeQuery(query: string) {
            return api.post('/api/ai/analyze', {
                query,
                datasourceId: this.datasourceChoosen?.id.toString()
            })
                .then((res) => res.data);
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

            if(!this.datasourceChoosen) return;

            const requestId = this.currentRequestId;

            try {
                // Démarrer le stream via fetch (Server-Sent Events)
                const response = await fetch(`${API_BASE_URL}/ai/analyze-stream`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'text/event-stream',
                    },
                    body: JSON.stringify({
                        query,
                        datasourceId: this.datasourceChoosen.id.toString(),
                        requestId,
                    }),
                });

                if (!response.ok || !response.body) {
                    throw new Error(`Le stream a échoué (HTTP ${response.status})`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (this.isAnalyzing) {
                    const {done, value} = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, {stream: true});

                    // Découper le buffer en blocs SSE (séparés par une ligne vide)
                    const events = buffer.split('\n\n');
                    buffer = events.pop() ?? '';

                    for (const event of events) {
                        const lines = event.split('\n');
                        let eventType = 'message';
                        let data = '';

                        for (const line of lines) {
                            if (line.startsWith('event:')) {
                                eventType = line.slice(6).trim();
                            } else if (line.startsWith('data:')) {
                                data = line.slice(5).trim();
                            }
                        }

                        if (!data) continue;

                        try {
                            const parsed = JSON.parse(data);

                            if (eventType === 'end') {
                                this._finalizeAiStream();
                            } else if (eventType === 'error') {
                                this.aiStreamError = parsed.error ?? 'Erreur inconnue';
                                this._finalizeAiStream();
                            } else if (parsed.chunk) {
                                this.rawAiResponse += parsed.chunk;
                                this.aiResponse = this.rawAiResponse;
                            }
                        } catch (e) {
                            console.error('[AI Stream] Failed to parse event:', e);
                        }
                    }
                }

                // Si le stream s'est terminé normalement sans événement end explicite
                if (this.isAnalyzing) {
                    this._finalizeAiStream();
                }

            } catch (error) {
                console.error("[AI Stream] Failed to start:", error);
                this.aiStreamError = error instanceof Error ? error.message : String(error);
                this._finalizeAiStream(true);
            }
        },

        /**
         * Annule l'analyse IA en cours.
         */
        async cancelAiAnalysisStream(): Promise<void> {
            if (!this.isAnalyzing || !this.currentRequestId) return;

            const requestId = this.currentRequestId;

            try {
                await api.post('/ai/cancel-stream', {requestId});
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
