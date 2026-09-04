import {ChatCompletionResponse} from "@mistralai/mistralai/models/components";
import {SqliteService} from "./sqlite.service";
import PostgresqlService from "./postgresql.service";
import {TableIndexesDto} from "../commons/data/dto/table-indexes-dto";
import {ParametersEnum} from "../commons/data/dto/parameters-enum";
import {ParametersService} from "./parameters.service";
import {ParameterDto} from "../commons/data/dto/parameter-dto";

const {Mistral} = require("@mistralai/mistralai")

export class AiService {

    private static cache = new Map<string, ChatCompletionResponse>();
    private static activeStreams = new Map<string, AbortController>();

    public static getMistralClient() {
        const apiKey = ParametersService.getByCode(ParametersEnum.AI_API_KEY);
        if(!apiKey) throw new Error("Missing API key setting");

        return new Mistral({
            apiKey: apiKey.value
        })
    }

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
                            if(tableIndexes) indexes.set(table, tableIndexes);
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

        const availableCountries = await ParametersService.getAvailableCountries();
        const preferedLanguage = ParametersService.getByCode(ParametersEnum.AI_DEFAULT_LANGAGE)
            ? availableCountries.find(a => a.code === ParametersService.getByCode(ParametersEnum.AI_DEFAULT_LANGAGE)!.code)
            : null;

        const response = await this.getMistralClient().chat.complete({
            model: 'ministral-14b-latest',
            messages: [
                {
                    role: "system",
                    content: `Analyse cette requete SQL pour identifier les problemes de performance (scans sequentiels,
                    index manquants, jointures couteuses, etc.) et propose des optimisations concretes (ajout d'index,
                    reecriture de la requete, etc.). Sois precis et justifie chaque suggestion.${indexesStatsFormatted.length > 0 ? `
                    Pour t'aider dans l'analyse, voici les statistiques des index de chaque table de la requete : ${JSON.stringify(indexesStatsFormatted)}.` : ''}
                    Chaque partie de ta reponse devra etre aeree visuellement, pour rendre la lecture confortable.
                    ${preferedLanguage ? `Pour finir, l'utilisateur souhaite que l'analyse soit dans la langue suivante : ${preferedLanguage}`: ""}
                    Voici la requete : ${query}`
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
                            if(tableIndexes) indexes.set(table, tableIndexes);
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

        const availableCountries = await ParametersService.getAvailableCountries();
        const preferedLanguage = ParametersService.getByCode(ParametersEnum.AI_DEFAULT_LANGAGE)
            ? availableCountries.find(a => a.code === ParametersService.getByCode(ParametersEnum.AI_DEFAULT_LANGAGE)!.value)?.name
            : null;

        try {
            const prompt = `Analyse cette requete SQL pour identifier les probl\u00e8mes de performance (scans sequentiels,
                        index manquants, jointures co\u00fbteuses, etc.) et propose des optimisations concr\u00e8tes (ajout d'index,
                        reecriture de la requete, etc.). Sois precis et justifie chaque suggestion.${indexesStatsFormatted.length > 0 ? `
                        Pour t'aider dans l'analyse, voici les statistiques des index de chaque table de la requete : ${JSON.stringify(indexesStatsFormatted)}.` : ''}
                        Chaque partie de ta reponse devra etre aeree visuellement, pour rendre la lecture confortable.
                        ${preferedLanguage ? `Pour finir, et c'est tres important, l'utilisateur souhaite que l'analyse soit écrite dans la langue suivante : ${preferedLanguage}`: ""}
                        Voici la requete : ${query}`;
            console.log(prompt);
            const stream = await this.getMistralClient().chat.stream({
                model: 'ministral-14b-latest',
                messages: [
                    {
                        role: "system",
                        content: prompt
                    }
                ],
                responseFormat: { type: 'text' },
                signal: combinedSignal,
            });

            // Parcourir le stream et envoyer chaque chunk
            for await (const chunk of stream) {
                if (chunk.data.choices?.[0]?.delta?.content) {
                    onChunk(chunk.data.choices[0].delta.content);
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
