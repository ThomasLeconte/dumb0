import {ChatCompletionResponse} from "@mistralai/mistralai/models/components";
import {SqliteService} from "./sqlite.service";
import PostgresqlService from "./postgresql.service";
import {TableIndexesDto} from "../commons/data/dto/table-indexes-dto";

const {Mistral} = require("@mistralai/mistralai")

export class AiService {
    private static mistralClient = new Mistral({
        apiKey: process.env.AI_API_KEY ?? "vgv3PFnsvCi2FHJjQtDznBWasesB8oMG"
    })

    private static cache = new Map<string, ChatCompletionResponse>();
    private static activeStreams = new Map<string, AbortController>();

    public static async analyzeQuery(args: { query: string; datasourceId?: string }): Promise<ChatCompletionResponse> {
        const {query, datasourceId} = args;
        
        // Si une datasourceId est fournie, récupérer les stats des index
        let indexesStatsFormatted: { tableName: string; indexes: { name: string; def: string }[] }[] = [];
        
        if (datasourceId) {
            const regex = /(?<=[FROM,JOIN]\s)([a-zA-Z]{1,})/gm;
            const tables = query.match(regex)?.map(matche => matche) || [];
            
            if (tables.length > 0) {
                const datasource = await SqliteService.getDatasourceById(datasourceId);
                if (!datasource) {
                    throw new Error(`Datasource not found with id ${datasourceId}`);
                }

                const db = await PostgresqlService.initConnection(datasource);
                
                try {
                    const indexes = new Map<string, TableIndexesDto[]>();
                    
                    await Promise.all(
                        tables.map(async (table) => {
                            const tableIndexes = await PostgresqlService.getTableIndexes(db, table);
                            indexes.set(table, tableIndexes);
                        })
                    );

                    indexesStatsFormatted = Array.from(indexes.entries()).map(entry => ({
                        tableName: entry[0],
                        indexes: entry[1].map(v => ({ name: v.name, def: v.def }))
                    }));
                } finally {
                    db.end();
                }
            }
        }

        // Vérifier le cache
        if (this.cache.has(query)) {
            return Promise.resolve(this.cache.get(query)!);
        }

        const response = await this.mistralClient.chat.complete({
            model: 'ministral-14b-latest',
            messages: [
                {
                    role: "system",
                    content: `Analyse cette requ\u00eate SQL pour identifier les probl\u00e8mes de performance (scans s\u00e9quentiels,
                    index manquants, jointures co\u00fbteuses, etc.) et propose des optimisations concr\u00e8tes (ajout d'index,
                    r\u00e9\u00e9criture de la requ\u00eate, etc.). Sois pr\u00e9cis et justifie chaque suggestion.${indexesStatsFormatted.length > 0 ? `
                    Pour t'aider dans l'analyse, voici les statistiques des index de chaque table de la requ\u00eate : ${JSON.stringify(indexesStatsFormatted)}.` : ''}
                    Chaque partie de ta r\u00e9ponse devra \u00eatre a\u00e9r\u00e9e visuellement, pour rendre la lecture confortable. Voici la requ\u00eate : ${query}`
                }
            ],
            responseFormat: {
                type: 'text'
            }
        });

        this.cache.set(query, response);
        return response;
    }

    /**
     * Analyse une requête SQL avec streaming.
     * @param args - { query: string; datasourceId?: string; signal?: AbortSignal }
     * @param onChunk - Callback appelé pour chaque chunk de réponse
     * @returns Promise<void> (résolue à la fin du stream ou en erreur)
     */
    public static async analyzeQueryStream(
        args: { query: string; datasourceId?: string; signal?: AbortSignal },
        onChunk: (chunk: string) => void
    ): Promise<void> {
        const { query, datasourceId, signal } = args;
        
        if (!query.trim()) {
            throw new Error("Query is empty");
        }

        // Préparer le prompt avec les stats des index si datasourceId est fourni
        let indexesStatsFormatted: { tableName: string; indexes: { name: string; def: string }[] }[] = [];
        
        if (datasourceId) {
            const regex = /(?<=[FROM,JOIN]\s)([a-zA-Z]{1,})/gm;
            const tables = query.match(regex)?.map(matche => matche) || [];
            
            if (tables.length > 0) {
                const datasource = await SqliteService.getDatasourceById(datasourceId);
                if (!datasource) {
                    throw new Error(`Datasource not found with id ${datasourceId}`);
                }

                const db = await PostgresqlService.initConnection(datasource);
                
                try {
                    const indexes = new Map<string, TableIndexesDto[]>();
                    
                    await Promise.all(
                        tables.map(async (table) => {
                            const tableIndexes = await PostgresqlService.getTableIndexes(db, table);
                            indexes.set(table, tableIndexes);
                        })
                    );

                    indexesStatsFormatted = Array.from(indexes.entries()).map(entry => ({
                        tableName: entry[0],
                        indexes: entry[1].map(v => ({ name: v.name, def: v.def }))
                    }));
                } finally {
                    db.end();
                }
            }
        }

        const controller = new AbortController();
        const combinedSignal = signal || controller.signal;
        
        try {
            const stream = await this.mistralClient.chat.completeStream({
                model: 'ministral-14b-latest',
                messages: [
                    {
                        role: "system",
                        content: `Analyse cette requ\u00eate SQL pour identifier les probl\u00e8mes de performance (scans s\u00e9quentiels,
                        index manquants, jointures co\u00fbteuses, etc.) et propose des optimisations concr\u00e8tes (ajout d'index,
                        r\u00e9\u00e9criture de la requ\u00eate, etc.). Sois pr\u00e9cis et justifie chaque suggestion.${indexesStatsFormatted.length > 0 ? `
                        Pour t'aider dans l'analyse, voici les statistiques des index de chaque table de la requ\u00eate : ${JSON.stringify(indexesStatsFormatted)}.` : ''}
                        Chaque partie de ta r\u00e9ponse devra \u00eatre a\u00e9r\u00e9e visuellement, pour rendre la lecture confortable. Voici la requ\u00eate : ${query}`
                    }
                ],
                responseFormat: { type: 'text' },
                signal: combinedSignal,
            });

            // Parcourir le stream et envoyer chaque chunk
            for await (const chunk of stream) {
                if (chunk.choices?.[0]?.delta?.content) {
                    onChunk(chunk.choices[0].delta.content);
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error("AI analysis cancelled");
            }
            console.error("[AI Service] Stream error:", error);
            throw new Error(
                `AI analysis failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Annule un stream en cours.
     * @param requestId - ID de la requête à annuler
     */
    public static cancelStream(requestId: string): void {
        const controller = this.activeStreams.get(requestId);
        if (controller) {
            controller.abort();
            this.activeStreams.delete(requestId);
        }
    }

    /**
     * Démarre un stream et stocke le controller pour annulation.
     * @param requestId - ID unique de la requête
     * @param args - Arguments pour analyzeQueryStream
     * @param onChunk - Callback pour chaque chunk
     */
    public static async startStream(
        requestId: string,
        args: { query: string; datasourceId?: string },
        onChunk: (chunk: string) => void
    ): Promise<void> {
        const controller = new AbortController();
        this.activeStreams.set(requestId, controller);
        
        try {
            await this.analyzeQueryStream(
                { ...args, signal: controller.signal },
                onChunk
            );
        } finally {
            this.activeStreams.delete(requestId);
        }
    }
}